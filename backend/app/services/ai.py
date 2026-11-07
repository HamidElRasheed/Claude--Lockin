"""AI: interpret answers and write daily/weekly reports, using Claude.

Every call to the model lives in this module so the provider or model can be
swapped without touching the routers. Prompts live in app/prompts/*.md.
Output is structured (validated Pydantic models), never free text parsing.
"""

import logging
from functools import cache
from pathlib import Path
from typing import Literal

import anthropic
from pydantic import BaseModel

from app.config import settings

log = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"


class AIError(Exception):
    """The model could not produce a usable answer."""


@cache
def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=30.0, max_retries=2)


@cache
def _prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")


def _parse[T: BaseModel](prompt: str, user_content: str, output: type[T], max_tokens: int = 2048) -> T:
    """One structured call. Raises AIError on refusal, truncation or API failure."""
    try:
        response = _client().messages.parse(
            model=settings.ai_model,
            max_tokens=max_tokens,
            system=_prompt(prompt),
            messages=[{"role": "user", "content": user_content}],
            output_format=output,
            output_config={"effort": "low"},
        )
    except anthropic.APIStatusError as exc:
        log.warning("AI call %s failed: HTTP %s", prompt, exc.status_code)
        raise AIError("ai_unavailable") from exc
    except anthropic.APIConnectionError as exc:
        log.warning("AI call %s failed: connection error", prompt)
        raise AIError("ai_unavailable") from exc

    if response.stop_reason in ("refusal", "max_tokens") or response.parsed_output is None:
        log.warning("AI call %s unusable: stop_reason=%s", prompt, response.stop_reason)
        raise AIError("ai_unusable")
    return response.parsed_output


class Interpretation(BaseModel):
    status: Literal["done", "partial", "missed"]
    reason: str | None


def interpret(goal_title: str, text: str) -> Interpretation:
    """Turn what the user said about one goal into done/partial/missed + a short reason."""
    return _parse(
        "interpret",
        f"Mål: {goal_title}\nBrukeren sa: {text}",
        Interpretation,
        max_tokens=1024,
    )
