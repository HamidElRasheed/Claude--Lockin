"""Pydantic schemas. Mirrors docs/API.md — JSON uses camelCase, Python uses snake_case."""

from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

Weekday = Literal["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
GoalStatus = Literal["done", "partial", "missed"]


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class GoalDraft(ApiModel):
    title: str
    days: list[Weekday]
    time: str | None = None
    weekly_target: int | None = None


class GoalUpdate(ApiModel):
    title: str | None = None
    days: list[Weekday] | None = None
    time: str | None = None
    weekly_target: int | None = None
    active: bool | None = None


class Goal(GoalDraft):
    id: str
    active: bool


class ParseGoalsRequest(ApiModel):
    text: str


class Today(ApiModel):
    date: str
    goals: list[Goal]
    review_done: bool


class Transcript(ApiModel):
    text: str


class InterpretRequest(ApiModel):
    goal_id: str
    text: str


class Interpretation(ApiModel):
    status: GoalStatus
    reason: str | None = None


class GoalEntry(ApiModel):
    goal_id: str
    goal_title: str
    status: GoalStatus
    reason: str | None = None
    transcript: str | None = None


class CompleteReviewRequest(ApiModel):
    date: str
    entries: list[GoalEntry]
    reflection: str | None = None


class DailyLog(ApiModel):
    date: str
    entries: list[GoalEntry]
    reflection: str | None = None
    summary: str
    tomorrow_tip: str


class SuggestionChange(ApiModel):
    from_day: Weekday | None = None
    to_day: Weekday | None = None
    time: str | None = None


class Suggestion(ApiModel):
    text: str
    goal_id: str | None = None
    change: SuggestionChange | None = None


class WeeklyReport(ApiModel):
    week: str
    went_well: list[str]
    patterns: list[str]
    suggestions: list[Suggestion]


class GenerateWeeklyRequest(ApiModel):
    week: str


class ErrorBody(ApiModel):
    code: str
    message: str


class ErrorResponse(ApiModel):
    error: ErrorBody
