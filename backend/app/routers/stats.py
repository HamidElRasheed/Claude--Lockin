from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import current_user_id
from app.db import get_db
from app.services import stats

router = APIRouter(tags=["stats"])


@router.get("/stats")
def get_stats(
    weeks: int = Query(default=4, ge=1, le=26),
    db: Session = Depends(get_db),
    user_id: str = Depends(current_user_id),
) -> dict:
    """Progress dashboard: rates per goal, weekday and week, plus one row per day. JSON is camelCase."""
    return stats.build(db, user_id, weeks)
