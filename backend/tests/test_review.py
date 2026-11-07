import pytest
from fastapi.testclient import TestClient

from app import models
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.services import ai


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def goal_id(client) -> str:
    with SessionLocal() as db:
        goal = models.Goal(user_id=settings.demo_user_id, title="Trene", days=["mon"], time="07:00")
        db.add(goal)
        db.commit()
        return goal.id


def test_interpret_returns_status_and_reason(client, goal_id, monkeypatch) -> None:
    def fake(title: str, text: str) -> ai.Interpretation:
        assert title == "Trene"
        return ai.Interpretation(status="missed", reason="Jobbet sent")

    monkeypatch.setattr(ai, "interpret", fake)
    res = client.post("/review/interpret", json={"goalId": goal_id, "text": "Nei, jobbet sent."})

    assert res.status_code == 200
    assert res.json() == {"status": "missed", "reason": "Jobbet sent"}


def test_interpret_unknown_goal(client) -> None:
    res = client.post("/review/interpret", json={"goalId": "nope", "text": "Ja"})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "goal_not_found"


def test_interpret_ai_failure(client, goal_id, monkeypatch) -> None:
    def fail(title: str, text: str) -> ai.Interpretation:
        raise ai.AIError("ai_unavailable")

    monkeypatch.setattr(ai, "interpret", fail)
    res = client.post("/review/interpret", json={"goalId": goal_id, "text": "Ja"})
    assert res.status_code == 502
    assert res.json()["error"]["code"] == "interpretation_failed"
