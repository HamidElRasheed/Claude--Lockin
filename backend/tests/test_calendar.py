from datetime import date
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import clock

MONDAY = date(2026, 11, 9)


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(clock, "today", lambda: MONDAY)
    with TestClient(app) as c:
        yield c


def _query(url: str) -> dict[str, str]:
    parsed = urlparse(url)
    assert f"{parsed.scheme}://{parsed.netloc}{parsed.path}" == "https://calendar.google.com/calendar/render"
    return {k: v[0] for k, v in parse_qs(parsed.query).items()}


def test_link_for_goal_with_time(client) -> None:
    goal = client.post("/goals", json={"title": "Trene", "days": ["fri", "wed"], "time": "07:00"}).json()
    res = client.get(f"/goals/{goal['id']}/calendar-link")
    assert res.status_code == 200
    q = _query(res.json()["url"])
    assert q["action"] == "TEMPLATE"
    assert q["text"] == "Trene"
    assert q["dates"] == "20261111T070000/20261111T073000"  # next Wednesday
    assert q["ctz"] == "Europe/Oslo"
    assert q["recur"] == "RRULE:FREQ=WEEKLY;BYDAY=WE,FR"
    assert q["details"] == "Fra Lockin"


def test_link_for_goal_without_time_is_all_day_and_includes_today(client) -> None:
    goal = client.post("/goals", json={"title": "Lese", "days": ["mon"]}).json()
    q = _query(client.get(f"/goals/{goal['id']}/calendar-link").json()["url"])
    assert q["dates"] == "20261109/20261110"
    assert q["recur"] == "RRULE:FREQ=WEEKLY;BYDAY=MO"


def test_link_unknown_goal_is_404(client) -> None:
    res = client.get("/goals/nope/calendar-link")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "goal_not_found"


def test_apply_moves_wednesday_to_thursday_at_seven(client) -> None:
    goal = client.post("/goals", json={"title": "Trene", "days": ["mon", "wed"], "time": "18:00"}).json()
    res = client.post(
        "/suggestions/apply",
        json={"goalId": goal["id"], "change": {"fromDay": "wed", "toDay": "thu", "time": "07:00"}},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["goal"]["days"] == ["mon", "thu"]
    assert body["goal"]["time"] == "07:00"
    q = _query(body["calendarUrl"])
    assert q["dates"] == "20261109T070000/20261109T073000"
    assert q["recur"] == "RRULE:FREQ=WEEKLY;BYDAY=MO,TH"
    assert client.get("/goals").json()[0]["days"] == ["mon", "thu"]


def test_apply_with_only_to_day_adds_the_day(client) -> None:
    goal = client.post("/goals", json={"title": "Lese", "days": ["mon"]}).json()
    res = client.post("/suggestions/apply", json={"goalId": goal["id"], "change": {"toDay": "sat"}})
    assert res.json()["goal"]["days"] == ["mon", "sat"]


def test_apply_unknown_goal_is_404(client) -> None:
    res = client.post("/suggestions/apply", json={"goalId": "nope", "change": {"time": "07:00"}})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "goal_not_found"


def test_apply_empty_change_is_422(client) -> None:
    goal = client.post("/goals", json={"title": "Lese", "days": ["mon"]}).json()
    res = client.post("/suggestions/apply", json={"goalId": goal["id"], "change": {"fromDay": "mon"}})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "nothing_to_change"
