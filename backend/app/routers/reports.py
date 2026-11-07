from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import StringConstraints
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.schemas import ApiModel, WeeklyReport
from app.services import weekly
from app.services.ai import AIError

router = APIRouter(prefix="/reports", tags=["reports"])

Week = Annotated[str, StringConstraints(pattern=weekly.WEEK_PATTERN)]


class GenerateWeekly(ApiModel):
    week: Week


def _check_week(week: str) -> None:
    try:
        weekly.week_bounds(week)
    except ValueError:  # e.g. 2026-W60: right shape, not a real ISO week
        raise HTTPException(status_code=422, detail="invalid_week") from None


@router.get("/weekly", response_model=WeeklyReport, response_model_by_alias=True)
def get_weekly(week: Annotated[Week, Query()], db: Session = Depends(get_db)) -> WeeklyReport:
    _check_week(week)
    report = weekly.get_stored(db, settings.demo_user_id, week)
    if report is None:
        raise HTTPException(status_code=404, detail="report_not_found")
    return report


@router.post("/weekly/generate", response_model=WeeklyReport, response_model_by_alias=True)
def generate_weekly(body: GenerateWeekly, db: Session = Depends(get_db)) -> WeeklyReport:
    """Sync on purpose: FastAPI runs it in a thread, so the AI call does not block the loop."""
    _check_week(body.week)
    try:
        return weekly.generate(db, settings.demo_user_id, body.week)
    except weekly.NoLogsError:
        raise HTTPException(status_code=404, detail="no_logs_for_week") from None
    except AIError:
        raise HTTPException(status_code=502, detail="report_failed") from None
