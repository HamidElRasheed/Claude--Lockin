"""Day score 1-10 and the weekly target. Pure maths, no AI.

score = 1 + 9 * (0.6 * goal_share + 0.4 * (satisfaction - 1) / 9), rounded to one decimal.
goal_share = mean of done 1 / partial 0.5 / missed 0. Without satisfaction: 1 + 9 * goal_share.
"""

from collections.abc import Iterable
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models

STATUS_SCORE = {"done": 1.0, "partial": 0.5, "missed": 0.0}
GOAL_WEIGHT = 0.6
DEFAULT_TARGET_DAYS = 5
DEFAULT_TARGET_SCORE = 7


def goal_share(statuses: Iterable[str]) -> float | None:
    values = [STATUS_SCORE.get(s, 0.0) for s in statuses]
    return sum(values) / len(values) if values else None


def day_score(statuses: Iterable[str], satisfaction: int | None) -> float | None:
    share = goal_share(statuses)
    if share is None and satisfaction is None:
        return None
    if satisfaction is None:
        mix = share
    elif share is None:
        mix = (satisfaction - 1) / 9
    else:
        mix = GOAL_WEIGHT * share + (1 - GOAL_WEIGHT) * (satisfaction - 1) / 9
    return round(1 + 9 * mix, 1)


def get_settings(db: Session, user_id: str) -> models.UserSettings:
    row = db.get(models.UserSettings, user_id)
    if row is None:
        row = models.UserSettings(
            user_id=user_id, target_days=DEFAULT_TARGET_DAYS, target_score=DEFAULT_TARGET_SCORE
        )
    return row


def week_summary(db: Session, user_id: str, monday: date) -> dict:
    """The non-AI part of the weekly report: average score and the weekly target with cushion."""
    sunday = monday + timedelta(days=6)
    logs = {
        log.date: log
        for log in db.scalars(
            select(models.DailyLog).where(
                models.DailyLog.user_id == user_id,
                models.DailyLog.date >= monday,
                models.DailyLog.date <= sunday,
            )
        )
    }
    settings = get_settings(db, user_id)
    day_scores = []
    for i in range(7):
        d = monday + timedelta(days=i)
        log = logs.get(d)
        day_scores.append({"date": d.isoformat(), "score": log.score if log else None})
    scores = [d["score"] for d in day_scores if d["score"] is not None]
    at_target = sum(1 for s in scores if s >= settings.target_score)
    return {
        "score_average": round(sum(scores) / len(scores), 1) if scores else None,
        "days_at_target": at_target,
        "days_reviewed": len(logs),
        "target_days": settings.target_days,
        "target_score": settings.target_score,
        "target_met": at_target >= settings.target_days,
        "day_scores": day_scores,
    }
