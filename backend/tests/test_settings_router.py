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


def test_get_settings_returns_defaults_for_new_user(client, mock_cursor):
    mock_cursor.fetchone.return_value = None
    response = client.get("/settings", headers={"X-User-ID": "new_user"})
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_provider"] == "claude"
    assert data["daily_new_limit"] == 5
    assert data["show_niqqud"] is True
    assert data["timezone"] == "America/Sao_Paulo"


def test_get_settings_returns_saved_values(client, mock_cursor):
    mock_cursor.fetchone.return_value = ("gpt-4o", 10, False, "America/Sao_Paulo")
    response = client.get("/settings", headers={"X-User-ID": "user1"})
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_provider"] == "gpt-4o"
    assert data["daily_new_limit"] == 10
    assert data["show_niqqud"] is False
    assert data["timezone"] == "America/Sao_Paulo"


def test_put_settings_upserts_and_returns_payload(client, mock_cursor):
    payload = {
        "preferred_provider": "gpt-4o",
        "daily_new_limit": 7,
        "show_niqqud": False,
        "timezone": "America/Sao_Paulo",
    }
    response = client.put(
        "/settings",
        json=payload,
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["preferred_provider"] == "gpt-4o"
    assert data["daily_new_limit"] == 7
    assert data["show_niqqud"] is False
    assert data["timezone"] == "America/Sao_Paulo"


def test_put_settings_invalid_provider_rejected(client, mock_cursor):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "malicious_provider",
            "daily_new_limit": 5,
            "show_niqqud": True,
        },
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422


def test_get_settings_missing_user_returns_422(client):
    response = client.get("/settings")
    assert response.status_code == 422


def test_put_settings_missing_user_returns_422(client):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "claude",
            "daily_new_limit": 5,
            "show_niqqud": True,
        },
    )
    assert response.status_code == 422


def test_upsert_executes_correct_sql(client, mock_cursor):
    payload = {
        "preferred_provider": "gemini",
        "daily_new_limit": 3,
        "show_niqqud": True,
        "timezone": "America/Sao_Paulo",
    }
    client.put(
        "/settings",
        json=payload,
        headers={"X-User-ID": "user1"},
    )
    assert mock_cursor.execute.call_count == 1
    args, kwargs = mock_cursor.execute.call_args
    sql_upper = args[0].upper() if args else ""
    assert "INSERT INTO USER_SETTINGS" in sql_upper
    assert "ON CONFLICT" in sql_upper
    assert "EXCLUDED.PREFERRED_PROVIDER" in sql_upper


def test_put_settings_rejects_daily_new_limit_zero(client):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "claude",
            "daily_new_limit": 0,
            "show_niqqud": True,
            "timezone": "America/Sao_Paulo",
        },
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422


def test_put_settings_rejects_negative_daily_new_limit(client):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "claude",
            "daily_new_limit": -1,
            "show_niqqud": True,
            "timezone": "America/Sao_Paulo",
        },
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422


def test_put_settings_rejects_invalid_timezone(client):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "claude",
            "daily_new_limit": 5,
            "show_niqqud": True,
            "timezone": "Not/AReal/Timezone",
        },
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422


def test_put_settings_rejects_overly_long_timezone(client):
    response = client.put(
        "/settings",
        json={
            "preferred_provider": "claude",
            "daily_new_limit": 5,
            "show_niqqud": True,
            "timezone": "A" * 65,
        },
        headers={"X-User-ID": "user1"},
    )
    assert response.status_code == 422
