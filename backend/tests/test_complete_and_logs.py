import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ai


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(
        ai,
        "daily_summary",
        lambda entries, reflection, context="": ai.DailySummary(
            summary="Travel dag, trening glapp.", tomorrowTip="Legg treningstøyet frem."
        ),
    )
    with TestClient(app) as c:
        yield c


def goal(client, title: str) -> dict:
    return client.post("/goals", json={"title": title, "days": ["mon"]}).json()


def complete(client, day: str, entries: list[dict], reflection: str | None = "Lang dag."):
    return client.post("/review/complete", json={"date": day, "entries": entries, "reflection": reflection})


def entry(g: dict, status: str, reason: str | None = None) -> dict:
    return {"goalId": g["id"], "goalTitle": g["title"], "status": status, "reason": reason, "transcript": None}


def test_complete_saves_day_with_summary(client) -> None:
    trene = goal(client, "Trene")
    res = complete(client, "2026-11-09", [entry(trene, "missed", "Jobbet sent")])
    assert res.status_code == 200
    body = res.json()
    assert body["date"] == "2026-11-09"
    assert body["summary"] == "Travel dag, trening glapp."
    assert body["tomorrowTip"] == "Legg treningstøyet frem."
    assert body["entries"][0]["status"] == "missed"
    assert body["entries"][0]["reason"] == "Jobbet sent"

    assert client.get("/logs/2026-11-09").json() == body


def test_complete_twice_replaces_the_day(client) -> None:
    trene = goal(client, "Trene")
    complete(client, "2026-11-09", [entry(trene, "missed")])
    complete(client, "2026-11-09", [entry(trene, "done")])
    logs = client.get("/logs?from=2026-11-01&to=2026-11-30").json()
    assert len(logs) == 1
    assert [e["status"] for e in logs[0]["entries"]] == ["done"]


def test_ai_failure_still_saves_answers(client, monkeypatch) -> None:
    def fail(entries, reflection, context=""):
        raise ai.AIError("ai_unavailable")

    monkeypatch.setattr(ai, "daily_summary", fail)
    trene = goal(client, "Trene")
    res = complete(client, "2026-11-09", [entry(trene, "done")])
    assert res.status_code == 200
    assert res.json()["entries"][0]["status"] == "done"
    assert "lagret" in res.json()["summary"]


def test_complete_rejects_unknown_goal(client) -> None:
    res = complete(client, "2026-11-09", [{"goalId": "nope", "goalTitle": "X", "status": "done"}])
    assert res.status_code == 404


def test_logs_newest_first_and_404(client) -> None:
    trene = goal(client, "Trene")
    complete(client, "2026-11-08", [entry(trene, "done")])
    complete(client, "2026-11-10", [entry(trene, "partial")])
    dates = [log["date"] for log in client.get("/logs?from=2026-11-01&to=2026-11-30").json()]
    assert dates == ["2026-11-10", "2026-11-08"]
    assert client.get("/logs/2026-11-01").status_code == 404
    assert client.get("/logs/not-a-date").status_code == 422
