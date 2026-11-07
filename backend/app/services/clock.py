"""The user's 'today'. One place, so tests can freeze time and the demo can fake a date."""

from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.config import settings

WEEKDAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")


def today() -> date:
    return datetime.now(ZoneInfo(settings.timezone)).date()


def weekday(d: date) -> str:
    return WEEKDAYS[d.weekday()]
