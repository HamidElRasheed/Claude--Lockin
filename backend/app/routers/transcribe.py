import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.schemas import Transcript
from app.services import stt

router = APIRouter(tags=["transcribe"])

MAX_BYTES = 10 * 1024 * 1024  # 10 MB is far more than a short spoken answer


@router.post("/transcribe", response_model=Transcript, response_model_by_alias=True)
async def transcribe(audio: UploadFile) -> Transcript:
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty_audio")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="audio_too_large")

    suffix = Path(audio.filename or "answer.m4a").suffix or ".m4a"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp_path = Path(tmp.name)
    try:
        tmp.write(data)
        tmp.close()
        text = await run_in_threadpool(stt.transcribe, tmp_path)
    except stt.TranscriptionError:
        raise HTTPException(status_code=502, detail="transcription_failed") from None
    finally:
        # Privacy: audio is never kept, also on errors.
        tmp.close()
        tmp_path.unlink(missing_ok=True)

    return Transcript(text=text)
