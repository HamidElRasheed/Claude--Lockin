"""Weekly report: collect one ISO week of logs, ask Claude for patterns and suggestions, store it."""

import re
from datetime import date, timedelta

from pydantic import BaseModel, ValidationError
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app import models
from app.schemas import Suggestion, SuggestionChange, WeeklyReport
from app.services.ai import AIError, _parse
from app.services.clock import WEEKDAYS

WEEK_PATTERN = r"^\d{4}-W\d{2}$"
DAY_NAMES = ("mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag")
STATUS_NAMES = {"done": "gjort", "partial": "delvis", "missed": "ikke gjort"}
MAX_ITEMS = 3


class NoLogsError(Exception):
    """The week has no daily logs to build a report from."""


class AISuggestion(BaseModel):
    text: str
    goalId: str | None  # noqa: N815 (camelCase matches the prompt)
    fromDay: str | None  # noqa: N815
    toDay: str | None  # noqa: N815
    time: str | None


class AIWeeklyReport(BaseModel):
    wentWell: list[str]  # noqa: N815
    patterns: list[str]
    suggestions: list[AISuggestion]


def week_bounds(week: str) -> tuple[date, date]:
    """'2026-W45' -> (monday, sunday). Raises ValueError on a bad week string."""
    if not re.match(WEEK_PATTERN, week):
        raise ValueError("invalid_week")
    monday = date.fromisocalendar(int(week[:4]), int(week[6:]), 1)
    return monday, monday + timedelta(days=6)


def iso_week(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


def build_input(db: Session, user_id: str, week: str) -> tuple[str, set[str]]:
    """The text sent to the model, plus the ids of the user's goals. Raises NoLogsError."""
    monday, sunday = week_bounds(week)
    logs = list(
        db.scalars(
            select(models.DailyLog)
            .where(
                models.DailyLog.user_id == user_id,
                models.DailyLog.date >= monday,
                models.DailyLog.date <= sunday,
            )
            .order_by(models.DailyLog.date)
            .options(selectinload(models.DailyLog.entries))
        )
    )
    if not logs:
        raise NoLogsError
    goals = list(
        db.scalars(
            select(models.Goal)
            .where(models.Goal.user_id == user_id, models.Goal.active.is_(True))
            .order_by(models.Goal.created_at)
        )
    )

    lines = [f"Uke {week} ({monday.isoformat()} til {sunday.isoformat()})", "", "Mål:"]
    for g in goals:
        parts = [f'id={g.id}', f'"{g.title}"', "dager: " + ",".join(g.days)]
        if g.time:
            parts.append(f"kl. {g.time}")
        if g.weekly_target:
            parts.append(f"ukemål: {g.weekly_target} ganger")
        lines.append("- " + ", ".join(parts))

    lines += ["", "Dager:"]
    for log in logs:
        lines.append(f"{DAY_NAMES[log.date.weekday()]} {log.date.isoformat()} ({WEEKDAYS[log.date.weekday()]}):")
        for e in log.entries:
            line = f"  - {e.goal_title} (id={e.goal_id}): {STATUS_NAMES.get(e.status, e.status)}"
            if e.reason:
                line += f'. Grunn: "{e.reason}"'
            lines.append(line)
        if log.reflection:
            lines.append(f'  Brukerens oppsummering: "{log.reflection}"')
        if log.summary:
            lines.append(f"  Dagsrapport: {log.summary}")

    totals: dict[str, list[int]] = {}
    for log in logs:
        for e in log.entries:
            t = totals.setdefault(e.goal_title, [0, 0])
            t[0] += e.status == "done"
            t[1] += 1
    lines += ["", "Totalt denne uka:"]
    lines += [f"- {title}: {done} av {count} gjort" for title, (done, count) in totals.items()]

    return "\n".join(lines), {g.id for g in goals}


def write_report(user_content: str) -> AIWeeklyReport:
    """The one AI call. Tests monkeypatch this."""
    return _parse("weekly_report", user_content, AIWeeklyReport, max_tokens=2048)


def _clean(items: list[str]) -> list[str]:
    return [s.strip() for s in items if s and s.strip()][:MAX_ITEMS]


def to_report(week: str, raw: AIWeeklyReport, goal_ids: set[str]) -> WeeklyReport:
    """Map model output to the API schema. Invalid suggestions are dropped, not fatal."""
    suggestions: list[Suggestion] = []
    for s in raw.suggestions:
        if not s.text or not s.text.strip():
            continue
        try:
            change = None
            if s.fromDay or s.toDay or s.time:
                change = SuggestionChange(from_day=s.fromDay, to_day=s.toDay, time=s.time)
                if change.time is not None and not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", change.time):
                    continue
            suggestions.append(
                Suggestion(
                    text=s.text.strip(),
                    goal_id=s.goalId if s.goalId in goal_ids else None,
                    change=change,
                )
            )
        except ValidationError:
            continue
    return WeeklyReport(
        week=week,
        went_well=_clean(raw.wentWell),
        patterns=_clean(raw.patterns),
        suggestions=suggestions[:MAX_ITEMS],
    )


def generate(db: Session, user_id: str, week: str) -> WeeklyReport:
    """Build, store (replacing any old one) and return the report. Raises NoLogsError / AIError."""
    user_content, goal_ids = build_input(db, user_id, week)
    report = to_report(week, write_report(user_content), goal_ids)
    if not (report.went_well or report.patterns or report.suggestions):
        raise AIError("ai_unusable")

    db.execute(
        delete(models.WeeklyReport).where(
            models.WeeklyReport.user_id == user_id, models.WeeklyReport.week == week
        )
    )
    db.add(models.WeeklyReport(user_id=user_id, week=week, content=report.model_dump(by_alias=True)))
    db.commit()
    return report


def get_stored(db: Session, user_id: str, week: str) -> WeeklyReport | None:
    row = db.scalar(
        select(models.WeeklyReport)
        .where(models.WeeklyReport.user_id == user_id, models.WeeklyReport.week == week)
        .order_by(models.WeeklyReport.created_at.desc())
    )
    return WeeklyReport.model_validate(row.content) if row else None
