from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import models
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.services import ai, clock, score, weekly


def test_day_score_formula() -> None:
    assert score.day_score([], None) is None
    assert score.day_score(["done", "done"], None) == 10.0
    assert score.day_score(["missed"], None) == 1.0
    assert score.day_score(["done", "partial"], None) == 7.8  # 1 + 9 * 0.75
    assert score.day_score(["done"], 10) == 10.0
    assert score.day_score(["missed"], 1) == 1.0
    assert score.day_score(["done", "missed"], 7) == 6.1  # 1 + 9 * (0.6*0.5 + 0.4*6/9)
    assert score.day_score([], 4) == 4.0


@pytest.fixture
def client(monkeypatch):
    seen: dict = {}

    def fake(entries, reflection, context=""):
        seen["context"] = context
        return ai.DailySummary(summary="Grei dag.", tomorrowTip="Legg deg tidlig.", suggestion="Gjør trening lettere.")

    monkeypatch.setattr(ai, "daily_summary", fake)
    monkeypatch.setattr(clock, "today", lambda: date(2026, 11, 8))
    with TestClient(app) as c:
        c.seen = seen
        yield c


def test_complete_stores_satisfaction_score_and_suggestion(client) -> None:
    g = client.post("/goals", json={"title": "Trene", "days": ["mon"]}).json()
    res = client.post(
        "/review/complete",
        json={
            "date": "2026-11-02",
            "entries": [{"goalId": g["id"], "goalTitle": "Trene", "status": "done"}],
            "satisfaction": 7,
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["satisfaction"] == 7
    assert body["score"] == score.day_score(["done"], 7)
    assert body["suggestion"] == "Gjør trening lettere."
    assert "Ukemål: minst 7/10 på 5 av 7" in client.seen["context"]
    assert client.get("/logs/2026-11-02").json()["score"] == body["score"]


def test_satisfaction_out_of_range_is_rejected(client) -> None:
    res = client.post("/review/complete", json={"date": "2026-11-02", "entries": [], "satisfaction": 11})
    assert res.status_code == 422


def test_settings_defaults_and_update(client) -> None:
    assert client.get("/settings").json() == {"targetDays": 5, "targetScore": 7}
    assert client.put("/settings", json={"targetDays": 4}).json() == {"targetDays": 4, "targetScore": 7}
    assert client.put("/settings", json={"targetScore": 6}).json() == {"targetDays": 4, "targetScore": 6}
    assert client.get("/settings").json() == {"targetDays": 4, "targetScore": 6}
    assert client.put("/settings", json={"targetDays": 8}).status_code == 422
    # settings are per user
    assert client.get("/settings", headers={"X-User-Id": "other-phone-1234"}).json()["targetDays"] == 5


def test_weekly_report_and_stats_include_scores(client, monkeypatch) -> None:
    with SessionLocal() as db:
        for d, s in [(date(2026, 11, 2), 8.0), (date(2026, 11, 3), 6.5), (date(2026, 11, 4), 7.0)]:
            db.add(models.DailyLog(user_id=settings.demo_user_id, date=d, score=s, satisfaction=7))
        db.commit()
    client.put("/settings", json={"targetDays": 2, "targetScore": 7})

    monkeypatch.setattr(
        weekly, "write_report", lambda content: weekly.AIWeeklyReport(wentWell=["Bra."], patterns=[], suggestions=[])
    )
    body = client.post("/reports/weekly/generate", json={"week": "2026-W45"}).json()
    assert body["scoreAverage"] == 7.2
    assert body["daysAtTarget"] == 2
    assert body["daysReviewed"] == 3
    assert body["targetMet"] is True
    assert len(body["dayScores"]) == 7
    assert body["dayScores"][0] == {"date": "2026-11-02", "score": 8.0}
    assert body["dayScores"][6]["score"] is None

    # Stored report gets fresh numbers when the target changes
    client.put("/settings", json={"targetDays": 3})
    stored = client.get("/reports/weekly?week=2026-W45").json()
    assert stored["targetMet"] is False and stored["targetDays"] == 3

    stats = client.get("/stats?weeks=1").json()
    assert stats["overall"]["scoreAverage"] == 7.2
    assert [d["score"] for d in stats["days"]][:3] == [8.0, 6.5, 7.0]
