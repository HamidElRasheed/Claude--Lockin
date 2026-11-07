from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.auth import current_user_id
from app.db import get_db
from app.schemas import Goal, Today
from app.services import clock

router = APIRouter(tags=["today"])


@router.get("/today", response_model=Today, response_model_by_alias=True)
def get_today(
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> Today:
    day = clock.today()
    weekday = clock.weekday(day)

    goals = db.scalars(
        select(models.Goal)
        .where(models.Goal.user_id == user_id, models.Goal.active.is_(True))
        .order_by(models.Goal.time.is_(None), models.Goal.time, models.Goal.created_at)
    )
    todays_goals = [Goal.model_validate(g) for g in goals if weekday in g.days]

    review_done = (
        db.scalar(
            select(models.DailyLog.id).where(
                models.DailyLog.user_id == user_id, models.DailyLog.date == day
            )
        )
        is not None
    )

    return Today(date=day.isoformat(), goals=todays_goals, review_done=review_done)
