import pytest
from fastapi.testclient import TestClient

from app import models
from app.config import settings
from app.db import SessionLocal
from app.main import app
from app.services import ai

PHONE_A = {"X-User-Id": "3f2b1c9e-aaaa-4bbb-8ccc-000000000001"}
PHONE_B = {"X-User-Id": "3f2b1c9e-aaaa-4bbb-8ccc-000000000002"}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        ai,
        "daily_summary",
        lambda entries, reflection: ai.DailySummary(summary="Rolig dag.", tomorrowTip="Legg deg tidlig."),
    )
    with TestClient(app) as c:
        yield c


def make_goal(client, headers: dict, title: str) -> dict:
    res = client.post("/goals", json={"title": title, "days": ["mon"]}, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()


def complete_day(client, headers: dict, goal: dict) -> None:
    entry = {"goalId": goal["id"], "goalTitle": goal["title"], "status": "done", "reason": None, "transcript": None}
    body = {"date": "2026-11-09", "entries": [entry], "reflection": None}
    res = client.post("/review/complete", json=body, headers=headers)
    assert res.status_code == 200, res.text


def test_two_phones_see_only_their_own_data(client) -> None:
    a = make_goal(client, PHONE_A, "Trene")
    b = make_goal(client, PHONE_B, "Lese")
    complete_day(client, PHONE_A, a)

    assert [g["title"] for g in client.get("/goals", headers=PHONE_A).json()] == ["Trene"]
    assert [g["title"] for g in client.get("/goals", headers=PHONE_B).json()] == ["Lese"]

    assert len(client.get("/logs?from=2026-11-01&to=2026-11-30", headers=PHONE_A).json()) == 1
    assert client.get("/logs?from=2026-11-01&to=2026-11-30", headers=PHONE_B).json() == []
    assert client.get("/logs/2026-11-09", headers=PHONE_B).status_code == 404

    # A phone cannot touch another phone's goals.
    assert client.patch(f"/goals/{a['id']}", json={"title": "X"}, headers=PHONE_B).status_code == 404
    assert client.delete(f"/goals/{a['id']}", headers=PHONE_B).status_code == 404


def test_without_header_uses_demo_user(client) -> None:
    make_goal(client, {}, "Trene")
    with SessionLocal() as db:
        assert [g.user_id for g in db.query(models.Goal)] == [settings.demo_user_id]
    assert client.get("/goals", headers=PHONE_A).json() == []


@pytest.mark.parametrize("bad", ["short", "a" * 65, "has space 123", "ugyldig_id_123", "id.with.dots"])
def test_invalid_user_id_gives_400(client, bad: str) -> None:
    res = client.get("/goals", headers={"X-User-Id": bad})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "invalid_user_id"
