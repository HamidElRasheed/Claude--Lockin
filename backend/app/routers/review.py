from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.db import get_db
from app.schemas import InterpretRequest, Interpretation
from app.services import ai

router = APIRouter(prefix="/review", tags=["review"])


@router.post("/interpret", response_model=Interpretation, response_model_by_alias=True)
async def interpret(body: InterpretRequest, db: Session = Depends(get_db)) -> Interpretation:
    goal = db.scalar(
        select(models.Goal).where(
            models.Goal.id == body.goal_id, models.Goal.user_id == settings.demo_user_id
        )
    )
    if goal is None:
        raise HTTPException(status_code=404, detail="goal_not_found")
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="empty_text")

    try:
        result = await run_in_threadpool(ai.interpret, goal.title, body.text)
    except ai.AIError:
        raise HTTPException(status_code=502, detail="interpretation_failed") from None

    return Interpretation(status=result.status, reason=result.reason)
