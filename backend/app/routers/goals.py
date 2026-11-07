from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.db import get_db
from app.schemas import Goal, GoalDraft, GoalUpdate, ParseGoalsRequest
from app.services import ai

router = APIRouter(prefix="/goals", tags=["goals"])


def _get_own_goal(db: Session, goal_id: str) -> models.Goal:
    """Fetch a goal that belongs to the current user, or 404."""
    goal = db.scalar(
        select(models.Goal).where(
            models.Goal.id == goal_id, models.Goal.user_id == settings.demo_user_id
        )
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="goal_not_found")
    return goal


@router.get("", response_model=list[Goal], response_model_by_alias=True)
def list_goals(db: Session = Depends(get_db)) -> list[models.Goal]:
    return list(
        db.scalars(
            select(models.Goal)
            .where(models.Goal.user_id == settings.demo_user_id)
            .order_by(models.Goal.time.is_(None), models.Goal.time, models.Goal.created_at)
        )
    )


@router.post("", response_model=Goal, response_model_by_alias=True, status_code=201)
def create_goal(draft: GoalDraft, db: Session = Depends(get_db)) -> models.Goal:
    goal = models.Goal(
        user_id=settings.demo_user_id,
        title=draft.title,
        days=list(dict.fromkeys(draft.days)),  # remove duplicates, keep order
        time=draft.time,
        weekly_target=draft.weekly_target,
        active=True,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=Goal, response_model_by_alias=True)
def update_goal(goal_id: str, update: GoalUpdate, db: Session = Depends(get_db)) -> models.Goal:
    goal = _get_own_goal(db, goal_id)
    # Only fields the app actually sent are changed (so "time": null can clear a time).
    for field, value in update.model_dump(exclude_unset=True).items():
        if field == "days" and value is not None:
            value = list(dict.fromkeys(value))
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: str, db: Session = Depends(get_db)) -> Response:
    goal = _get_own_goal(db, goal_id)
    has_history = db.scalar(select(models.GoalEntry.id).where(models.GoalEntry.goal_id == goal.id))
    if has_history:
        # Keep history intact: logs point to this goal. Hide it instead of deleting.
        goal.active = False
    else:
        db.delete(goal)
    db.commit()
    return Response(status_code=204)


@router.post("/parse", response_model=list[GoalDraft], response_model_by_alias=True)
async def parse_goals(body: ParseGoalsRequest) -> list[GoalDraft]:
    """Free text ("trene 3 ganger i uka, lese hver kveld") -> suggested goal cards. Not saved."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="empty_text")
    try:
        parsed = await run_in_threadpool(ai.parse_goals, body.text)
    except ai.AIError:
        raise HTTPException(status_code=502, detail="parse_failed") from None

    # Never trust model output blindly: run every suggestion through the same rules as user input.
    drafts: list[GoalDraft] = []
    for item in parsed:
        try:
            drafts.append(GoalDraft.model_validate(item.model_dump()))
        except ValidationError:
            continue
    if not drafts:
        raise HTTPException(status_code=422, detail="no_goals_found")
    return drafts
