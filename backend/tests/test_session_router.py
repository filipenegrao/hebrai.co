import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app
from db import db_connection


# ---------------------------------------------------------------------------
# Local fixtures — override conftest client for this module
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_cursor():
    return MagicMock()


@pytest.fixture
def mock_conn(mock_cursor):
    conn = MagicMock()
    conn.cursor.return_value.__enter__ = lambda s: mock_cursor
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn


@pytest.fixture
def client(mock_conn):
    app.dependency_overrides[db_connection] = lambda: (yield mock_conn)
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_card_row(word_id=14, card_id=1, fsrs_state=None):
    """Build a joined cards+words row matching the SELECT in get_next_cards."""
    return (
        card_id,                        # c.id
        "test_user",                    # c.user_id
        word_id,                        # c.word_id
        fsrs_state if fsrs_state is not None else {},  # c.fsrs_state
        None,                           # c.format_override
        word_id,                        # w.id
        "אֶרֶץ",                         # w.hebrew
        "erets",                        # w.transliteration
        "terra",                        # w.gloss_pt
        {"class": "noun"},              # w.morphology
        14,                             # w.frequency_rank
        "Gn 1:1",                       # w.source_reference
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_get_next_cards_returns_cards(client, mock_cursor):
    ai_content = {
        "question": "O que significa אֶרֶץ?",
        "options": ["terra", "céu", "água", "fogo"],
        "correct_index": 0,
        "explanation": "...",
    }
    mock_cursor.fetchone.side_effect = [
        (1, "claude"),   # user_settings: new_limit=1 so no new-word query is needed
        (ai_content,),   # ai_content_cache hit for the due card
    ]
    mock_cursor.fetchall.side_effect = [
        [_make_card_row()],  # due cards (reps=0 → multiple_choice)
        # new words query is skipped because new_limit=1 == len(due_rows)
    ]

    response = client.get("/session/next-cards", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    data = response.json()
    assert "cards" in data
    assert "session_size" in data
    assert data["session_size"] == 1
    assert data["cards"][0]["format"] == "multiple_choice"


def test_get_next_cards_missing_user_id(client):
    response = client.get("/session/next-cards")
    assert response.status_code == 422


def test_get_next_cards_invalid_fsrs_state_type(client, mock_cursor):
    # fsrs_state is a string instead of a dict — validation must reject it
    bad_row = _make_card_row(fsrs_state="not_a_dict")
    mock_cursor.fetchone.side_effect = [(1, "claude")]
    mock_cursor.fetchall.side_effect = [[bad_row]]

    response = client.get("/session/next-cards", headers={"X-User-ID": "test_user"})
    assert response.status_code == 422


def test_get_next_cards_invalid_fsrs_state_datetime(client, mock_cursor):
    # fsrs_state has a malformed due datetime — validation must reject it
    bad_row = _make_card_row(fsrs_state={"due": "not-a-datetime", "reps": 1})
    mock_cursor.fetchone.side_effect = [(1, "claude")]
    mock_cursor.fetchall.side_effect = [[bad_row]]

    response = client.get("/session/next-cards", headers={"X-User-ID": "test_user"})
    assert response.status_code == 422


def test_submit_review_updates_state(client, mock_cursor):
    mock_cursor.fetchone.return_value = (1, "test_user", 14, {"reps": 0})

    response = client.post(
        "/session/review",
        json={"card_id": 1, "rating": 3, "format_used": "multiple_choice"},
        headers={"X-User-ID": "test_user"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "next_due" in data
    assert "new_reps" in data
    assert data["new_reps"] == 1


def test_submit_review_wrong_user_forbidden(client, mock_cursor):
    mock_cursor.fetchone.return_value = (1, "other_user", 14, {})

    response = client.post(
        "/session/review",
        json={"card_id": 1, "rating": 3, "format_used": "flashcard"},
        headers={"X-User-ID": "test_user"},
    )
    assert response.status_code == 403


def test_submit_review_card_not_found(client, mock_cursor):
    mock_cursor.fetchone.return_value = None

    response = client.post(
        "/session/review",
        json={"card_id": 999, "rating": 2, "format_used": "typing"},
        headers={"X-User-ID": "test_user"},
    )
    assert response.status_code == 404
