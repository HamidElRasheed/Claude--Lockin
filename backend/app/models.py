"""Database models. Every table has user_id so real auth can be added later without a rewrite."""

import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def new_id() -> str:
    return uuid.uuid4().hex


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(200))
    days: Mapped[list[str]] = mapped_column(JSON)  # ["mon", "wed", ...]
    time: Mapped[str | None] = mapped_column(String(5))  # "HH:MM"
    weekly_target: Mapped[int | None] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class DailyLog(Base):
    __tablename__ = "daily_logs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    reflection: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str] = mapped_column(Text, default="")
    tomorrow_tip: Mapped[str] = mapped_column(Text, default="")
    satisfaction: Mapped[int | None] = mapped_column(Integer)  # 1-10, the user's own feeling
    score: Mapped[float | None] = mapped_column(Float)  # day score 1-10 (see services/score.py)
    suggestion: Mapped[str | None] = mapped_column(Text)  # AI: one change to a goal or the weekly target
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    entries: Mapped[list["GoalEntry"]] = relationship(
        back_populates="log", cascade="all, delete-orphan"
    )


class GoalEntry(Base):
    __tablename__ = "goal_entries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    log_id: Mapped[str] = mapped_column(ForeignKey("daily_logs.id"), index=True)
    goal_id: Mapped[str] = mapped_column(ForeignKey("goals.id"), index=True)
    goal_title: Mapped[str] = mapped_column(String(200))  # snapshot, survives goal renames
    status: Mapped[str] = mapped_column(String(10))  # done | partial | missed
    reason: Mapped[str | None] = mapped_column(Text)
    transcript: Mapped[str | None] = mapped_column(Text)

    log: Mapped[DailyLog] = relationship(back_populates="entries")


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    week: Mapped[str] = mapped_column(String(8), index=True)  # "2026-W45"
    content: Mapped[dict] = mapped_column(JSON)  # WeeklyReport schema as JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class UserSettings(Base):
    """Weekly target with a cushion: at least `target_score`/10 on `target_days` of 7 days."""

    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    target_days: Mapped[int] = mapped_column(Integer, default=5)
    target_score: Mapped[int] = mapped_column(Integer, default=7)
