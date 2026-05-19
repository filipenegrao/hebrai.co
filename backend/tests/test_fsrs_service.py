import pytest
from fsrs import Card as FSRSCard

from fsrs_service import (
    fsrs_state_to_card,
    card_to_fsrs_state,
    schedule_review,
    determine_format,
)


def test_new_card_has_zero_reps():
    card = fsrs_state_to_card({})
    assert card.reps == 0


def test_schedule_review_good_increases_reps():
    state = {}
    new_state = schedule_review(state, rating=3)
    assert new_state["reps"] == 1
    assert new_state["due"] is not None


def test_schedule_review_again_stays_low_stability():
    state = {}
    again_state = schedule_review(state, rating=1)
    assert again_state["reps"] >= 1

    easy_state = schedule_review({}, rating=4)
    assert easy_state["stability"] > again_state["stability"]


def test_determine_format_new_card_is_multiple_choice():
    assert determine_format({}, None) == "multiple_choice"


def test_determine_format_override_respected():
    assert determine_format({"reps": 0}, "flashcard") == "flashcard"


def test_determine_format_reps_1_to_3_is_flashcard():
    assert determine_format({"reps": 1}, None) == "flashcard"
    assert determine_format({"reps": 3}, None) == "flashcard"


def test_determine_format_reps_above_3_is_flashcard_or_typing():
    fmt = determine_format({"reps": 4}, None)
    assert fmt in ("flashcard", "typing")


def test_roundtrip_state_preserves_reps():
    card = FSRSCard()
    card.reps = 3
    state = card_to_fsrs_state(card)
    card2 = fsrs_state_to_card(state)
    assert card2.reps == card.reps
