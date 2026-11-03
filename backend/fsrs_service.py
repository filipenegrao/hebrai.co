from datetime import datetime

from fsrs import Card as FSRSCard
from fsrs import Rating, Scheduler, State

from models import ExerciseFormat

_scheduler = Scheduler()

_RATING_MAP = {1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy}


class AppCard(FSRSCard):
    """An fsrs ``Card`` plus the repetition counter the application owns.

    fsrs 6.3.1 models no repetition count: ``Card`` is a plain dataclass holding
    only ``card_id``, ``state``, ``step``, ``stability``, ``difficulty``, ``due``
    and ``last_review``. ``reps`` is therefore ours, persisted in the
    ``cards.fsrs_state`` JSONB column rather than by the library. Declaring it on
    a subclass keeps the attribute typed and survives a future fsrs release that
    adds ``__slots__`` to ``Card``, which plain attribute assignment would not.
    """

    reps: int = 0


def fsrs_state_to_card(state: dict) -> AppCard:
    card = AppCard()
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
        # Accepts any fsrs Card, including the plain ones the scheduler returns,
        # which carry no `reps`; AppCard supplies it.
        "reps": getattr(card, "reps", 0),
    }


def schedule_review(fsrs_state: dict, rating: int) -> dict:
    card = fsrs_state_to_card(fsrs_state)
    reviewed, _ = _scheduler.review_card(card, _RATING_MAP[rating])
    state = card_to_fsrs_state(reviewed)
    state["reps"] = fsrs_state.get("reps", 0) + 1
    return state


def determine_format(fsrs_state: dict, format_override: ExerciseFormat | None) -> ExerciseFormat:
    if format_override:
        return format_override
    reps = fsrs_state.get("reps", 0) if fsrs_state else 0
    if reps == 0:
        return "multiple_choice"
    if reps <= 3:
        return "flashcard"
    return "typing" if reps % 2 == 0 else "flashcard"
