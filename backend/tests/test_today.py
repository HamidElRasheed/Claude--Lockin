from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import models
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.services import clock

MONDAY = date(2026, 11, 9)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(clock, "today", lambda: MONDAY)
    with TestClient(app) as c:
        yield c


def test_today_shows_only_todays_active_goals_sorted_by_time(client) -> None:
    client.post("/goals", json={"title": "Lese", "days": ["mon"], "time": "21:00"})
    client.post("/goals", json={"title": "Trene", "days": ["mon", "wed"], "time": "07:00"})
    client.post("/goals", json={"title": "Svømme", "days": ["tue"], "time": "08:00"})
    hidden = client.post("/goals", json={"title": "Gammelt", "days": ["mon"]}).json()
    client.patch(f"/goals/{hidden['id']}", json={"active": False})

    res = client.get("/today")
    assert res.status_code == 200
    body = res.json()
    assert body["date"] == "2026-11-09"
    assert [g["title"] for g in body["goals"]] == ["Trene", "Lese"]
    assert body["reviewDone"] is False


def test_today_review_done_after_log_exists(client) -> None:
    with SessionLocal() as db:
        db.add(models.DailyLog(user_id=settings.demo_user_id, date=MONDAY))
        db.commit()
    assert client.get("/today").json()["reviewDone"] is True
