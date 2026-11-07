from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ai, clock

MONDAY = date(2026, 11, 9)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(clock, "today", lambda: MONDAY)
    with TestClient(app) as c:
        yield c


def goal(client, title: str, days: list[str]) -> dict:
    return client.post("/goals", json={"title": title, "days": days}).json()


def test_whole_day_maps_each_goal_and_lists_missing(client, monkeypatch) -> None:
    trene = goal(client, "Trene", ["mon"])
    lese = goal(client, "Lese", ["mon"])
    vann = goal(client, "Drikke vann", ["mon"])
    goal(client, "Svømme", ["tue"])  # not today, must not be sent to the AI

    def fake(goals, text):
        assert [title for _, title in goals] == ["Trene", "Lese", "Drikke vann"]
        return [
            ai.DayGoalResult(goalId=trene["id"], status="missed", reason="jobbet sent"),
            ai.DayGoalResult(goalId=lese["id"], status="done", reason=None),
            ai.DayGoalResult(goalId=vann["id"], status="not_mentioned", reason="gjettet"),
            ai.DayGoalResult(goalId="made-up", status="done", reason=None),  # ignored
        ]

    monkeypatch.setattr(ai, "interpret_day", fake)
    res = client.post("/review/interpret-day", json={"text": "Jobbet sent, rakk ikke gymmen. Leste før jeg sov."})

    assert res.status_code == 200
    body = res.json()
    assert [(g["goalTitle"], g["status"], g["reason"]) for g in body["goals"]] == [
        ("Trene", "missed", "jobbet sent"),
        ("Lese", "done", None),
        ("Drikke vann", None, None),
    ]
    assert body["missing"] == [vann["id"]]


def test_goal_missing_from_ai_answer_counts_as_not_mentioned(client, monkeypatch) -> None:
    trene = goal(client, "Trene", ["mon"])
    monkeypatch.setattr(ai, "interpret_day", lambda goals, text: [])
    body = client.post("/review/interpret-day", json={"text": "Fin dag."}).json()
    assert body["missing"] == [trene["id"]]


def test_empty_text_and_ai_failure(client, monkeypatch) -> None:
    goal(client, "Trene", ["mon"])
    assert client.post("/review/interpret-day", json={"text": "  "}).status_code == 400

    def fail(goals, text):
        raise ai.AIError("ai_unavailable")

    monkeypatch.setattr(ai, "interpret_day", fail)
    res = client.post("/review/interpret-day", json={"text": "Fin dag."})
    assert res.status_code == 502
    assert res.json()["error"]["code"] == "interpretation_failed"
