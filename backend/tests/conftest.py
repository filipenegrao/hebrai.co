from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from db import db_connection
from main import app


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
