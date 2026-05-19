from __future__ import annotations
from typing import Any
from pydantic import BaseModel


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
    format: str  # "multiple_choice" | "flashcard" | "typing"
    content: dict[str, Any]


class NextCardsResponse(BaseModel):
    cards: list[CardWithContent]
    session_size: int


class ReviewRequest(BaseModel):
    card_id: int
    rating: int  # 1=again 2=hard 3=good 4=easy
    format_used: str
    response_time_ms: int | None = None


class ReviewResponse(BaseModel):
    next_due: str  # ISO datetime string
    new_stability: float
    new_difficulty: float
    new_reps: int
