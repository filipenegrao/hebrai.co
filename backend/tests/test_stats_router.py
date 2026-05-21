import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from main import app
from db import db_connection


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


def test_daily_stats_returns_all_fields(client, mock_cursor):
    mock_cursor.fetchone.side_effect = [
        (12,),    # reviews today
        (3,),     # new words today
        (85.0,),  # retention rate
        (7,),     # streak days
    ]
    response = client.get("/stats/daily", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["reviews_today"] == 12
    assert data["new_words_today"] == 3
    assert data["retention_rate"] == 85.0
    assert data["streak_days"] == 7


def test_daily_stats_missing_user_returns_422(client):
    response = client.get("/stats/daily")
    assert response.status_code == 422


def test_daily_stats_new_user_returns_zeros(client, mock_cursor):
    mock_cursor.fetchone.side_effect = [
        (0,),
        (0,),
        (None,),  # no reviews → retention None → 0.0
        (0,),
    ]
    response = client.get("/stats/daily", headers={"X-User-ID": "new_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["reviews_today"] == 0
    assert data["new_words_today"] == 0
    assert data["retention_rate"] == 0.0
    assert data["streak_days"] == 0
