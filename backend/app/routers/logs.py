from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models
from app.auth import current_user_id
from app.db import get_db
from app.schemas import DailyLog
from app.services import clock
from app.services.logs import parse_date, to_schema

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=list[DailyLog], response_model_by_alias=True)
def list_logs(
    from_: str | None = Query(default=None, alias="from"),
    to: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> list[DailyLog]:
    end = parse_date(to) if to else clock.today()
    start = parse_date(from_) if from_ else end - timedelta(days=30)
    logs = db.scalars(
        select(models.DailyLog)
        .options(selectinload(models.DailyLog.entries))
        .where(
            models.DailyLog.user_id == user_id,
            models.DailyLog.date >= start,
            models.DailyLog.date <= end,
        )
        .order_by(models.DailyLog.date.desc())
    )
    return [to_schema(log) for log in logs]


@router.get("/{day}", response_model=DailyLog, response_model_by_alias=True)
def get_log(
    day: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> DailyLog:
    log = db.scalar(
        select(models.DailyLog)
        .options(selectinload(models.DailyLog.entries))
        .where(models.DailyLog.user_id == user_id, models.DailyLog.date == parse_date(day))
    )
    if log is None:
        raise HTTPException(status_code=404, detail="log_not_found")
    return to_schema(log)
