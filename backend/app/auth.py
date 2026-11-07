import re

from fastapi import Header, HTTPException

from app.config import settings

_USER_ID = re.compile(r"[A-Za-z0-9-]{8,64}")


def current_user_id(x_user_id: str | None = Header(default=None)) -> str:
    """The device's own random ID from X-User-Id. Without the header: the demo user."""
    if x_user_id is None:
        return settings.demo_user_id
    if not _USER_ID.fullmatch(x_user_id):
        raise HTTPException(status_code=400, detail="invalid_user_id")
    return x_user_id
