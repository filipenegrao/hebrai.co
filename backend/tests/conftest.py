import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from main import app
from db import db_connection


@pytest.fixture
def mock_db():
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value.__enter__ = lambda s: cursor
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    conn._cursor = cursor
    return conn, cursor


@pytest.fixture
def client(mock_db):
    conn, _ = mock_db
    app.dependency_overrides[db_connection] = lambda: (yield conn)
    yield TestClient(app)
    app.dependency_overrides.clear()
