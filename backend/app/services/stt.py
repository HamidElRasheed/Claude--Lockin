"""Speech-to-text behind one function, so providers can be swapped.

Primary: ElevenLabs Scribe. Fallback: Groq Whisper (free tier), used only if
ElevenLabs is not configured or fails.

Privacy rule: audio is never stored. The caller deletes the temp file, also on errors.
"""

import logging
from pathlib import Path

import httpx
from openai import OpenAI

from app.config import settings

log = logging.getLogger(__name__)

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/speech-to-text"
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
TIMEOUT_SECONDS = 30.0


class TranscriptionError(Exception):
    """No provider could transcribe the audio."""


def _elevenlabs(audio_path: Path) -> str:
    with audio_path.open("rb") as f:
        res = httpx.post(
            ELEVENLABS_URL,
            headers={"xi-api-key": settings.elevenlabs_api_key},
            data={
                "model_id": settings.elevenlabs_stt_model,
                "language_code": settings.elevenlabs_language,
                "tag_audio_events": "false",
            },
            files={"file": (audio_path.name, f, "application/octet-stream")},
            timeout=TIMEOUT_SECONDS,
        )
    res.raise_for_status()
    return str(res.json()["text"]).strip()


def _groq(audio_path: Path) -> str:
    client = OpenAI(api_key=settings.groq_api_key, base_url=GROQ_BASE_URL, timeout=TIMEOUT_SECONDS)
    with audio_path.open("rb") as f:
        result = client.audio.transcriptions.create(
            model=settings.groq_stt_model,
            file=f,
            language=settings.groq_language,
        )
    return result.text.strip()


def transcribe(audio_path: Path) -> str:
    """Return the Norwegian transcript of an audio file. Raises TranscriptionError."""
    providers = []
    if settings.elevenlabs_api_key:
        providers.append(("elevenlabs", _elevenlabs))
    if settings.groq_api_key:
        providers.append(("groq", _groq))
    if not providers:
        raise TranscriptionError("No speech-to-text provider configured")

    for name, provider in providers:
        try:
            return provider(audio_path)
        except Exception as exc:  # noqa: BLE001 — try the next provider
            # Log the provider and error type only, never the audio or transcript.
            log.warning("STT provider %s failed: %s", name, type(exc).__name__)
    raise TranscriptionError("All speech-to-text providers failed")
