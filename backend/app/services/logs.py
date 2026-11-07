"""Shared helpers for daily logs."""

from datetime import date

from fastapi import HTTPException

from app import models, schemas


def parse_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_date") from None


def to_schema(log: models.DailyLog) -> schemas.DailyLog:
    return schemas.DailyLog(
        date=log.date.isoformat(),
        entries=[
            schemas.GoalEntry(
                goal_id=e.goal_id,
                goal_title=e.goal_title,
                status=e.status,
                reason=e.reason,
                transcript=e.transcript,
            )
            for e in log.entries
        ],
        reflection=log.reflection,
        summary=log.summary,
        tomorrow_tip=log.tomorrow_tip,
    )
