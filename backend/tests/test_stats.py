from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ai, clock

MONDAY = date(2026, 11, 9)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(clock, "today", lambda: MONDAY)
    monkeypatch.setattr(
        ai, "daily_summary", lambda entries, reflection, context="": ai.DailySummary(summary="s", tomorrowTip="t")
    )
    with TestClient(app) as c:
        yield c


def test_stats_rates_per_goal_weekday_and_day(client) -> None:
    trene = client.post("/goals", json={"title": "Trene", "days": ["mon", "wed"]}).json()
    lese = client.post("/goals", json={"title": "Lese", "days": ["mon", "wed"]}).json()

    def complete(day, t, l):
        client.post("/review/complete", json={"date": day, "reflection": None, "entries": [
            {"goalId": trene["id"], "goalTitle": "Trene", "status": t},
            {"goalId": lese["id"], "goalTitle": "Lese", "status": l},
        ]})

    complete("2026-11-04", "missed", "done")   # wednesday
    complete("2026-11-09", "done", "partial")  # monday (today)

    s = client.get("/stats?weeks=1").json()
    assert s["from"] == "2026-11-03" and s["to"] == "2026-11-09"
    assert s["overall"]["reviews"] == 2
    assert s["overall"]["rate"] == 0.625  # (0 + 1 + 1 + 0.5) / 4
    assert s["overall"]["bestWeekday"] == "mon" and s["overall"]["hardestWeekday"] == "wed"
    goals = {g["title"]: g for g in s["goals"]}
    assert goals["Trene"]["rate"] == 0.5 and goals["Trene"]["missed"] == 1
    assert goals["Trene"]["weekdays"]["wed"] == 0.0
    assert goals["Lese"]["rate"] == 0.75
    assert len(s["days"]) == 7
    assert s["days"][-1] == {"date": "2026-11-09", "reviewed": True, "done": 1, "partial": 1,
                             "missed": 0, "total": 2, "rate": 0.75, "score": 7.8}
    assert s["days"][0]["reviewed"] is False and s["days"][0]["rate"] is None


def test_stats_empty_and_validation(client) -> None:
    s = client.get("/stats").json()
    assert s["overall"]["rate"] is None and s["overall"]["reviews"] == 0
    assert len(s["days"]) == 28
    assert client.get("/stats?weeks=0").status_code == 422
