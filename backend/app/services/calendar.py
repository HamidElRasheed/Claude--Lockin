"""Google Calendar "add event" links. No Google login or API: the app just opens the URL."""

from datetime import date, datetime, timedelta
from urllib.parse import urlencode

from app.config import settings
from app.services import clock

BASE_URL = "https://calendar.google.com/calendar/render"
EVENT_MINUTES = 30
DETAILS = "Fra Lockin"
BYDAY = {"mon": "MO", "tue": "TU", "wed": "WE", "thu": "TH", "fri": "FR", "sat": "SA", "sun": "SU"}


def next_occurrence(days: list[str], start: date) -> date:
    """First date on or after `start` that falls on one of `days`."""
    for offset in range(7):
        d = start + timedelta(days=offset)
        if clock.weekday(d) in days:
            return d
    return start


def _dates(day: date, time: str | None) -> str:
    if time is None:
        return f"{day:%Y%m%d}/{day + timedelta(days=1):%Y%m%d}"
    hour, minute = (int(part) for part in time.split(":"))
    start = datetime(day.year, day.month, day.day, hour, minute)
    end = start + timedelta(minutes=EVENT_MINUTES)
    return f"{start:%Y%m%dT%H%M%S}/{end:%Y%m%dT%H%M%S}"


def build_link(title: str, days: list[str], time: str | None) -> str:
    day = next_occurrence(days, clock.today())
    byday = ",".join(BYDAY[d] for d in clock.WEEKDAYS if d in days)
    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": _dates(day, time),
        "ctz": settings.timezone,
        "details": DETAILS,
        "recur": f"RRULE:FREQ=WEEKLY;BYDAY={byday}",
    }
    return f"{BASE_URL}?{urlencode(params)}"
