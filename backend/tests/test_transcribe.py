from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import stt


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_transcribe_returns_text_and_deletes_audio(client, monkeypatch) -> None:
    seen: list[Path] = []

    def fake(path: Path) -> str:
        seen.append(path)
        assert path.exists()
        return "Ja, jeg trente i dag."

    monkeypatch.setattr(stt, "transcribe", fake)
    res = client.post("/transcribe", files={"audio": ("answer.m4a", b"fake-audio", "audio/m4a")})

    assert res.status_code == 200
    assert res.json() == {"text": "Ja, jeg trente i dag."}
    assert not seen[0].exists()  # audio is never kept


def test_transcribe_failure_deletes_audio(client, monkeypatch) -> None:
    seen: list[Path] = []

    def fail(path: Path) -> str:
        seen.append(path)
        raise stt.TranscriptionError("down")

    monkeypatch.setattr(stt, "transcribe", fail)
    res = client.post("/transcribe", files={"audio": ("answer.m4a", b"fake-audio", "audio/m4a")})

    assert res.status_code == 502
    assert res.json()["error"]["code"] == "transcription_failed"
    assert not seen[0].exists()


def test_transcribe_rejects_empty_audio(client) -> None:
    res = client.post("/transcribe", files={"audio": ("answer.m4a", b"", "audio/m4a")})
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "empty_audio"
