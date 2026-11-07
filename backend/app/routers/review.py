import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.auth import current_user_id
from app.db import get_db
from app.schemas import (
    CompleteReviewRequest,
    DailyLog,
    DayGoal,
    DayInterpretationResponse,
    InterpretDayRequest,
    InterpretRequest,
    Interpretation,
)
from app.services import ai, clock
from app.services.logs import parse_date, to_schema

log = logging.getLogger(__name__)

router = APIRouter(prefix="/review", tags=["review"])

FALLBACK_SUMMARY = "Dagen er lagret. Oppsummeringen kunne ikke lages akkurat nå."


@router.post("/interpret-day", response_model=DayInterpretationResponse, response_model_by_alias=True)
async def interpret_day(
    body: InterpretDayRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> DayInterpretationResponse:
    """The user talks once about the whole day; every one of today's goals gets a status.
    Goals the user did not mention come back with status null and are listed in `missing`."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="empty_text")

    weekday = clock.weekday(clock.today())
    goals = [
        g
        for g in db.scalars(
            select(models.Goal)
            .where(models.Goal.user_id == user_id, models.Goal.active.is_(True))
            .order_by(models.Goal.time.is_(None), models.Goal.time, models.Goal.created_at)
        )
        if weekday in g.days
    ]
    if not goals:
        return DayInterpretationResponse(goals=[], missing=[])

    try:
        results = await run_in_threadpool(ai.interpret_day, [(g.id, g.title) for g in goals], body.text)
    except ai.AIError:
        raise HTTPException(status_code=502, detail="interpretation_failed") from None

    # Never trust the model's list blindly: one answer per real goal, in our order.
    by_id = {r.goalId: r for r in results}
    day_goals: list[DayGoal] = []
    for g in goals:
        r = by_id.get(g.id)
        mentioned = r is not None and r.status != "not_mentioned"
        day_goals.append(
            DayGoal(
                goal_id=g.id,
                goal_title=g.title,
                status=r.status if mentioned else None,
                reason=(r.reason or None) if mentioned else None,
            )
        )
    return DayInterpretationResponse(
        goals=day_goals, missing=[d.goal_id for d in day_goals if d.status is None]
    )


@router.post("/interpret", response_model=Interpretation, response_model_by_alias=True)
async def interpret(
    body: InterpretRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> Interpretation:
    goal = db.scalar(
        select(models.Goal).where(
            models.Goal.id == body.goal_id, models.Goal.user_id == user_id
        )
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="goal_not_found")
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="empty_text")

    try:
        result = await run_in_threadpool(ai.interpret, goal.title, body.text)
    except ai.AIError:
        raise HTTPException(status_code=502, detail="interpretation_failed") from None

    return Interpretation(status=result.status, reason=result.reason)


@router.post("/complete", response_model=DailyLog, response_model_by_alias=True)
async def complete(
    body: CompleteReviewRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> DailyLog:
    day = parse_date(body.date)

    # Only accept the user's own goals.
    own_ids = set(
        db.scalars(select(models.Goal.id).where(models.Goal.user_id == user_id))
    )
    unknown = [e.goal_id for e in body.entries if e.goal_id not in own_ids]
    if unknown:
        raise HTTPException(status_code=404, detail="goal_not_found")

    # One log per user per day: doing the review again replaces the earlier one.
    daily = db.scalar(
        select(models.DailyLog).where(
            models.DailyLog.user_id == user_id, models.DailyLog.date == day
        )
    )
    if daily is None:
        daily = models.DailyLog(user_id=user_id, date=day)
        db.add(daily)
    daily.reflection = body.reflection
    daily.entries = [
        models.GoalEntry(
            goal_id=e.goal_id,
            goal_title=e.goal_title,
            status=e.status,
            reason=e.reason,
            transcript=e.transcript,
        )
        for e in body.entries
    ]

    # The AI summary is a bonus: if it fails, the user's answers are still saved.
    try:
        result = await run_in_threadpool(
            ai.daily_summary,
            [
                {"goal": e.goal_title, "status": e.status, "reason": e.reason, "transcript": e.transcript}
                for e in body.entries
            ],
            body.reflection,
        )
        daily.summary, daily.tomorrow_tip = result.summary, result.tomorrowTip
    except ai.AIError:
        log.warning("daily summary failed for %s; saved without it", day)
        daily.summary, daily.tomorrow_tip = FALLBACK_SUMMARY, ""

    db.commit()
    db.refresh(daily)
    return to_schema(daily)
