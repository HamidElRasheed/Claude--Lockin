from datetime import date

from sqlalchemy import func, select

import seed
from app import models
from app.config import settings
from app.db import SessionLocal
from app.services import clock, weekly


def count(db, model) -> int:
    return db.scalar(select(func.count()).select_from(model))


def test_seed_creates_demo_and_is_rerunnable(monkeypatch) -> None:
    monkeypatch.setattr(clock, "today", lambda: date(2026, 11, 7))  # Saturday, week 45
    with SessionLocal() as db:
        db.add(models.Goal(user_id="someone-else", title="Behold", days=["mon"]))
        db.commit()

    first = seed.run()
    second = seed.run()
    assert first == second
    # 7 days of week 44 + Mon-Fri of week 45
    assert first["goals"] == 4 and first["logs"] == 12

    with SessionLocal() as db:
        assert count(db, models.Goal) == 5  # other users are untouched
        assert count(db, models.DailyLog) == 12
        assert count(db, models.GoalEntry) == first["entries"]

        logs = db.scalars(select(models.DailyLog).order_by(models.DailyLog.date)).all()
        assert logs[0].date == date(2026, 10, 26) and logs[-1].date == date(2026, 11, 6)
        assert all(log.summary and log.tomorrow_tip and log.reflection for log in logs)

        wednesday = next(log for log in logs if log.date == date(2026, 10, 28))
        training = next(e for e in wednesday.entries if e.goal_title == "Trene")
        assert (training.status, training.reason) == ("missed", "jobbet sent")

        # Sunday: only goals scheduled on Sundays get an entry (no training)
        sunday = next(log for log in logs if log.date == date(2026, 11, 1))
        assert {e.goal_title for e in sunday.entries} == {"Lese 20 min", "Ingen mobil etter 23", "Drikke vann"}

        # The previous week is enough to build a weekly report from
        content, goal_ids = weekly.build_input(db, settings.demo_user_id, "2026-W44")
        assert len(goal_ids) == 4 and "jobbet sent" in content


def test_seed_on_monday_only_previous_week(monkeypatch) -> None:
    monkeypatch.setattr(clock, "today", lambda: date(2026, 11, 2))
    assert seed.run()["logs"] == 7
