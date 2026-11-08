from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.auth import current_user_id
from app.db import get_db
from app.schemas import Settings, SettingsUpdate
from app.services import score

router = APIRouter(prefix="/settings", tags=["settings"])


def _out(row: models.UserSettings) -> Settings:
    return Settings(target_days=row.target_days, target_score=row.target_score)


@router.get("", response_model=Settings, response_model_by_alias=True)
def get_settings(db: Session = Depends(get_db), user_id: str = Depends(current_user_id)) -> Settings:
    return _out(score.get_settings(db, user_id))


@router.put("", response_model=Settings, response_model_by_alias=True)
def update_settings(
    body: SettingsUpdate, db: Session = Depends(get_db), user_id: str = Depends(current_user_id)
) -> Settings:
    """Weekly target with cushion, e.g. at least 7/10 on 5 of 7 days."""
    row = db.get(models.UserSettings, user_id)
    if row is None:
        row = score.get_settings(db, user_id)
        db.add(row)
    if body.target_days is not None:
        row.target_days = body.target_days
    if body.target_score is not None:
        row.target_score = body.target_score
    db.commit()
    return _out(row)
