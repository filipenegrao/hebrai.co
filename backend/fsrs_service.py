from datetime import datetime
from fsrs import Scheduler, Card as FSRSCard, Rating, State

_scheduler = Scheduler()

_RATING_MAP = {1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy}


def fsrs_state_to_card(state: dict) -> FSRSCard:
    card = FSRSCard()
    if not state:
        card.reps = 0
        return card

    if "state" in state:
        card.state = State(state["state"])

    if "step" in state:
        card.step = state["step"]
    if "stability" in state:
        card.stability = state["stability"]
    if "difficulty" in state:
        card.difficulty = state["difficulty"]

    due = state.get("due")
    if due:
        card.due = datetime.fromisoformat(due)

    last_review = state.get("last_review")
    if last_review:
        card.last_review = datetime.fromisoformat(last_review)

    card.reps = state.get("reps", 0)
    return card


def card_to_fsrs_state(card: FSRSCard) -> dict:
    due = card.due
    last_review = card.last_review
    return {
        "state": card.state.value if card.state is not None else None,
        "step": card.step,
        "stability": card.stability,
        "difficulty": card.difficulty,
        "due": due.isoformat() if due else None,
        "last_review": last_review.isoformat() if last_review else None,
        "reps": getattr(card, "reps", 0),
    }


def schedule_review(fsrs_state: dict, rating: int) -> dict:
    card = fsrs_state_to_card(fsrs_state)
    card, _ = _scheduler.review_card(card, _RATING_MAP[rating])
    state = card_to_fsrs_state(card)
    state["reps"] = fsrs_state.get("reps", 0) + 1
    return state


def determine_format(fsrs_state: dict, format_override: str | None) -> str:
    if format_override:
        return format_override
    reps = fsrs_state.get("reps", 0) if fsrs_state else 0
    if reps == 0:
        return "multiple_choice"
    if reps <= 3:
        return "flashcard"
    return "typing" if reps % 2 == 0 else "flashcard"
