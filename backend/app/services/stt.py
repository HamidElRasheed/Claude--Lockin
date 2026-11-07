"""Speech-to-text behind one function, so the provider can be swapped (e.g. NB-Whisper later).

Privacy rule: audio is never stored. The caller deletes the temp file, also on errors.
"""

from pathlib import Path

from openai import OpenAI

from app.config import settings


def transcribe(audio_path: Path) -> str:
    """Return the Norwegian transcript of an audio file."""
    client = OpenAI(api_key=settings.openai_api_key)
    with audio_path.open("rb") as f:
        result = client.audio.transcriptions.create(
            model=settings.stt_model,
            file=f,
            language=settings.stt_language,
        )
    return result.text.strip()
