from datetime import date

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


def make_goal(client, **overrides) -> dict:
    body = {"title": "Trene", "days": ["mon", "wed", "fri"], "time": "07:00", "weeklyTarget": 3}
    body.update(overrides)
    res = client.post("/goals", json=body)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_and_list(client) -> None:
    goal = make_goal(client)
    assert goal["title"] == "Trene"
    assert goal["weeklyTarget"] == 3
    assert goal["active"] is True

    res = client.get("/goals")
    assert res.status_code == 200
    assert [g["id"] for g in res.json()] == [goal["id"]]


def test_create_validates_input(client) -> None:
    assert client.post("/goals", json={"title": "  ", "days": ["mon"]}).status_code == 422
    assert client.post("/goals", json={"title": "Lese", "days": []}).status_code == 422
    assert client.post("/goals", json={"title": "Lese", "days": ["mon"], "time": "25:00"}).status_code == 422
    assert client.post("/goals", json={"title": "Lese", "days": ["funday"]}).status_code == 422


def test_patch_only_changes_sent_fields(client) -> None:
    goal = make_goal(client)
    res = client.patch(f"/goals/{goal['id']}", json={"time": None})
    assert res.status_code == 200
    updated = res.json()
    assert updated["time"] is None
    assert updated["title"] == "Trene"  # untouched


def test_delete_without_history_removes_goal(client) -> None:
    goal = make_goal(client)
    assert client.delete(f"/goals/{goal['id']}").status_code == 204
    assert client.get("/goals").json() == []


def test_delete_with_history_hides_goal(client) -> None:
    goal = make_goal(client)
    with SessionLocal() as db:
        log = models.DailyLog(user_id=settings.demo_user_id, date=date(2026, 11, 9))
        log.entries.append(
            models.GoalEntry(goal_id=goal["id"], goal_title="Trene", status="done")
        )
        db.add(log)
        db.commit()

    assert client.delete(f"/goals/{goal['id']}").status_code == 204
    goals = client.get("/goals").json()
    assert len(goals) == 1 and goals[0]["active"] is False


def test_unknown_goal_is_404(client) -> None:
    res = client.patch("/goals/nope", json={"title": "X"})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "goal_not_found"


def test_parse_keeps_only_valid_suggestions(client, monkeypatch) -> None:
    def fake(text: str) -> list[ai.ParsedGoal]:
        return [
            ai.ParsedGoal(title="Trene", days=["mon", "wed", "fri"], time="07:00", weeklyTarget=3),
            ai.ParsedGoal(title="Lese 20 min", days=["mon"], time="99:99", weeklyTarget=None),  # bad time
        ]

    monkeypatch.setattr(ai, "parse_goals", fake)
    res = client.post("/goals/parse", json={"text": "trene 3 ganger i uka om morgenen"})
    assert res.status_code == 200
    assert res.json() == [
        {"title": "Trene", "days": ["mon", "wed", "fri"], "time": "07:00", "weeklyTarget": 3}
    ]
    assert client.get("/goals").json() == []  # parse never saves
