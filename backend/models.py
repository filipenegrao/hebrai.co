from __future__ import annotations
from typing import Annotated, Any, Literal
from pydantic import BaseModel, Field


class Word(BaseModel):
    id: int
    hebrew: str
    transliteration: str
    gloss_pt: str
    morphology: dict[str, Any]
    frequency_rank: int | None
    source_reference: str | None


class CardWithContent(BaseModel):
    card_id: int
    word: Word
    format: Literal["multiple_choice", "flashcard", "typing"]
    content: dict[str, Any]


class NextCardsResponse(BaseModel):
    cards: list[CardWithContent]
    session_size: int


class ReviewRequest(BaseModel):
    card_id: int
    rating: Literal[1, 2, 3, 4]
    format_used: Literal["multiple_choice", "flashcard", "typing"]
    # Capped at 5 minutes (300 000 ms) — values beyond this are likely clock errors.
    response_time_ms: Annotated[int, Field(ge=0, le=300_000)] | None = None


class ReviewResponse(BaseModel):
    next_due: str  # ISO datetime string
    new_stability: float
    new_difficulty: float
    new_reps: int
