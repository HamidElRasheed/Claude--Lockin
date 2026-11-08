"""Progress dashboard numbers. Pure counting over the logs, no AI, so it is instant.

Score per entry: done = 1, partial = 0.5, missed = 0. A rate is the mean score (0..1).
No streaks on purpose: a bad day never "breaks" anything.
"""

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models
from app.services import clock

SCORE = {"done": 1.0, "partial": 0.5, "missed": 0.0}


def _rate(scores: list[float]) -> float | None:
    return round(sum(scores) / len(scores), 3) if scores else None


def _iso_week(d: date) -> str:
    year, week, _ = d.isocalendar()
    return f"{year}-W{week:02d}"


def build(db: Session, user_id: str, weeks: int) -> dict:
    end = clock.today()
    start = end - timedelta(days=7 * weeks - 1)
    logs = list(
        db.scalars(
            select(models.DailyLog)
            .options(selectinload(models.DailyLog.entries))
            .where(
                models.DailyLog.user_id == user_id,
                models.DailyLog.date >= start,
                models.DailyLog.date <= end,
            )
            .order_by(models.DailyLog.date)
        )
    )
    goals = list(
        db.scalars(
            select(models.Goal)
            .where(models.Goal.user_id == user_id, models.Goal.active.is_(True))
            .order_by(models.Goal.created_at)
        )
    )

    by_date = {log.date: log for log in logs}
    days = []
    all_scores: list[float] = []
    per_goal: dict[str, list[float]] = defaultdict(list)
    per_goal_weekday: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    per_goal_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"done": 0, "partial": 0, "missed": 0})
    per_weekday: dict[str, list[float]] = defaultdict(list)
    per_week: dict[str, list[float]] = defaultdict(list)

    d = start
    while d <= end:
        log = by_date.get(d)
        counts = {"done": 0, "partial": 0, "missed": 0}
        if log:
            for e in log.entries:
                s = SCORE.get(e.status, 0.0)
                counts[e.status] = counts.get(e.status, 0) + 1
                all_scores.append(s)
                per_goal[e.goal_id].append(s)
                per_goal_weekday[e.goal_id][clock.weekday(d)].append(s)
                per_goal_counts[e.goal_id][e.status] += 1
                per_weekday[clock.weekday(d)].append(s)
                per_week[_iso_week(d)].append(s)
        total = sum(counts.values())
        days.append(
            {
                "date": d.isoformat(),
                "reviewed": log is not None,
                **counts,
                "total": total,
                "rate": _rate([SCORE[k] for k, n in counts.items() for _ in range(n)]),
                "score": log.score if log else None,
            }
        )
        d += timedelta(days=1)

    day_scores = [x["score"] for x in days if x["score"] is not None]
    weekday_rates = {wd: _rate(per_weekday.get(wd, [])) for wd in clock.WEEKDAYS}
    rated = {wd: r for wd, r in weekday_rates.items() if r is not None}

    week_keys = sorted({_iso_week(start + timedelta(days=7 * i)) for i in range(weeks)} | set(per_week))
    return {
        "from": start.isoformat(),
        "to": end.isoformat(),
        "overall": {
            "rate": _rate(all_scores),
            "reviews": len(logs),
            "scoreAverage": round(sum(day_scores) / len(day_scores), 1) if day_scores else None,
            "days": (end - start).days + 1,
            "bestWeekday": max(rated, key=rated.get) if rated else None,
            "hardestWeekday": min(rated, key=rated.get) if rated else None,
        },
        "weekdays": weekday_rates,
        "weeks": [{"week": w, "rate": _rate(per_week.get(w, []))} for w in week_keys],
        "goals": [
            {
                "goalId": g.id,
                "title": g.title,
                **per_goal_counts[g.id],
                "rate": _rate(per_goal.get(g.id, [])),
                "weekdays": {wd: _rate(per_goal_weekday[g.id].get(wd, [])) for wd in clock.WEEKDAYS},
            }
            for g in goals
        ],
        "days": days,
    }
