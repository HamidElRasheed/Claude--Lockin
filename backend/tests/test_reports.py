from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import models
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.routers import reports
from app.services import weekly
from app.services.ai import AIError

# main.py registers this router once the branches are merged; until then, add it here (once).
if not any(getattr(r, "path", "").startswith("/reports") for r in app.routes):
    app.include_router(reports.router)

WEEK = "2026-W45"  # 2026-11-02 .. 2026-11-08


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def goal_id() -> str:
    with SessionLocal() as db:
        goal = models.Goal(
            user_id=settings.demo_user_id, title="Trene", days=["mon", "wed", "fri"], time="07:00", weekly_target=3
        )
        db.add(goal)
        db.flush()
        for day, status, reason in [(date(2026, 11, 2), "done", None), (date(2026, 11, 4), "missed", "jobbet sent")]:
            log = models.DailyLog(user_id=settings.demo_user_id, date=day, reflection="Lang dag.", summary="Kort.")
            log.entries.append(models.GoalEntry(goal_id=goal.id, goal_title="Trene", status=status, reason=reason))
            db.add(log)
        # A log in another week must not leak into the report
        other = models.DailyLog(user_id=settings.demo_user_id, date=date(2026, 11, 9), reflection="Neste uke")
        db.add(other)
        db.commit()
        return goal.id


def fake_report(goal_id: str) -> weekly.AIWeeklyReport:
    return weekly.AIWeeklyReport(
        wentWell=["Trening på mandag holdt.", "  "],
        patterns=["Trening faller bort på onsdager fordi du jobber sent."],
        suggestions=[
            weekly.AISuggestion(
                text="Flytt trening fra onsdag til torsdag 07:00?",
                goalId=goal_id,
                fromDay="wed",
                toDay="thu",
                time="07:00",
            ),
            weekly.AISuggestion(text="Ugyldig dag", goalId=None, fromDay="onsdag", toDay=None, time=None),
            weekly.AISuggestion(text="Ugyldig tid", goalId=None, fromDay=None, toDay=None, time="25:00"),
            weekly.AISuggestion(text="Ukjent mål", goalId="nope", fromDay=None, toDay=None, time=None),
        ],
    )


def test_generate_stores_and_returns_report(client, goal_id, monkeypatch) -> None:
    seen: dict[str, str] = {}

    def fake(user_content: str) -> weekly.AIWeeklyReport:
        seen["content"] = user_content
        return fake_report(goal_id)

    monkeypatch.setattr(weekly, "write_report", fake)
    res = client.post("/reports/weekly/generate", json={"week": WEEK})
    assert res.status_code == 200, res.text
    body = res.json()

    assert body["week"] == WEEK
    assert body["wentWell"] == ["Trening på mandag holdt."]
    assert len(body["patterns"]) == 1
    # invalid day and invalid time are dropped; unknown goal id becomes null
    assert body["suggestions"] == [
        {
            "text": "Flytt trening fra onsdag til torsdag 07:00?",
            "goalId": goal_id,
            "change": {"fromDay": "wed", "toDay": "thu", "time": "07:00"},
        },
        {"text": "Ukjent mål", "goalId": None, "change": None},
    ]

    content = seen["content"]
    assert "jobbet sent" in content and "Lang dag." in content and "ukemål: 3" in content
    assert "Neste uke" not in content

    # Stored: GET returns the same thing
    res = client.get("/reports/weekly", params={"week": WEEK})
    assert res.status_code == 200
    assert res.json() == body


def test_generate_replaces_existing(client, goal_id, monkeypatch) -> None:
    monkeypatch.setattr(weekly, "write_report", lambda _: fake_report(goal_id))
    client.post("/reports/weekly/generate", json={"week": WEEK})
    client.post("/reports/weekly/generate", json={"week": WEEK})
    with SessionLocal() as db:
        rows = db.query(models.WeeklyReport).filter_by(user_id=settings.demo_user_id, week=WEEK).count()
    assert rows == 1


def test_get_missing_report(client) -> None:
    res = client.get("/reports/weekly", params={"week": WEEK})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "report_not_found"


def test_generate_without_logs(client, monkeypatch) -> None:
    monkeypatch.setattr(weekly, "write_report", lambda _: pytest.fail("AI should not be called"))
    res = client.post("/reports/weekly/generate", json={"week": WEEK})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "no_logs_for_week"


def test_generate_ai_failure(client, goal_id, monkeypatch) -> None:
    def fail(_: str) -> weekly.AIWeeklyReport:
        raise AIError("ai_unavailable")

    monkeypatch.setattr(weekly, "write_report", fail)
    res = client.post("/reports/weekly/generate", json={"week": WEEK})
    assert res.status_code == 502
    assert res.json()["error"]["code"] == "report_failed"


@pytest.mark.parametrize("week", ["2026-45", "2026-W5", "W45-2026", "2026-W60", "2026-W00"])
def test_invalid_week(client, week) -> None:
    assert client.get("/reports/weekly", params={"week": week}).status_code == 422
    assert client.post("/reports/weekly/generate", json={"week": week}).status_code == 422


def test_week_helpers() -> None:
    assert weekly.week_bounds("2026-W45") == (date(2026, 11, 2), date(2026, 11, 8))
    assert weekly.iso_week(date(2026, 11, 7)) == "2026-W45"
