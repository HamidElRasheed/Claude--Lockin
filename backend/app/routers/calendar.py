from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.db import get_db
from app.schemas import ApiModel, Goal, TimeHHMM, Weekday
from app.services import calendar

router = APIRouter(tags=["calendar"])


def current_user_id() -> str:
    """The only place this router decides who the user is."""
    return settings.demo_user_id


class CalendarLink(ApiModel):
    url: str


class ApplyChange(ApiModel):
    from_day: Weekday | None = None
    to_day: Weekday | None = None
    time: TimeHHMM | None = None


class ApplySuggestionRequest(ApiModel):
    goal_id: str
    change: ApplyChange


class ApplySuggestionResponse(ApiModel):
    goal: Goal
    calendar_url: str


def _get_goal(db: Session, goal_id: str, user_id: str) -> models.Goal:
    goal = db.scalar(
        select(models.Goal).where(models.Goal.id == goal_id, models.Goal.user_id == user_id)
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="goal_not_found")
    return goal


def _link(goal: models.Goal) -> str:
    return calendar.build_link(goal.title, list(goal.days), goal.time)


@router.get("/goals/{goal_id}/calendar-link", response_model=CalendarLink, response_model_by_alias=True)
def calendar_link(
    goal_id: str, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)
) -> CalendarLink:
    return CalendarLink(url=_link(_get_goal(db, goal_id, user_id)))


@router.post("/suggestions/apply", response_model=ApplySuggestionResponse, response_model_by_alias=True)
def apply_suggestion(
    body: ApplySuggestionRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> ApplySuggestionResponse:
    change = body.change
    if change.to_day is None and change.time is None:
        raise HTTPException(status_code=422, detail="nothing_to_change")
    goal = _get_goal(db, body.goal_id, user_id)

    days = list(goal.days)
    if change.to_day is not None:
        if change.from_day is not None and change.from_day in days:
            days = [change.to_day if d == change.from_day else d for d in days]
        else:
            days.append(change.to_day)
        goal.days = list(dict.fromkeys(days))
    if change.time is not None:
        goal.time = change.time

    db.commit()
    db.refresh(goal)
    return ApplySuggestionResponse(goal=Goal.model_validate(goal), calendar_url=_link(goal))
