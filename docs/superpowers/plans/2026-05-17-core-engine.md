# hebrai.co — Core Study Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full study session loop: FastAPI endpoints for cards and reviews, FSRS scheduling, AI content generation via LiteLLM, and the Next.js session page with Hebrew exercise components.

**Architecture:** FastAPI handles scheduling (py-fsrs), AI content generation (LiteLLM), and caching. Next.js proxies session calls via API routes, adding the authenticated user_id from Better Auth. The session page is a client component managing card state locally. New cards (words not yet started) are introduced up to `daily_new_limit`; due cards are those with a past FSRS due date.

**Tech Stack:** FastAPI 0.128.5, py-fsrs 0.6.0, LiteLLM 1.55.0, psycopg2, pytest, httpx, Next.js 16.2 App Router, Tailwind CSS 4.3, shadcn/ui

**Version policy:** Inherit the foundation stack baseline and pin new dependencies explicitly when they are introduced.

---

## File Map

```
backend/
├── db.py                              ← psycopg2 ThreadedConnectionPool + FastAPI dependency
├── models.py                          ← Pydantic: Word, CardState, CardWithContent, NextCardsResponse, ReviewRequest, ReviewResponse
├── fsrs_service.py                    ← py-fsrs wrapper: fsrs_state_to_card(), schedule_review(), determine_format()
├── ai_service.py                      ← LiteLLM wrapper: hash_prompt(), generate_content()
├── session_router.py                  ← APIRouter: GET /session/next-cards, POST /session/review
├── main.py                            ← (modify) include session_router
├── requirements.txt                   ← (modify) add pytest==8.3.4, httpx==0.28.1, pytest-mock==3.14.0
└── tests/
    ├── conftest.py                    ← pytest fixtures: mock_db, test_client
    ├── test_fsrs_service.py
    ├── test_ai_service.py
    └── test_session_router.py

frontend/src/
├── app/
│   ├── api/
│   │   └── session/
│   │       ├── next-cards/
│   │       │   └── route.ts           ← GET proxy: auth check → add X-User-ID → call FastAPI
│   │       └── review/
│   │           └── route.ts           ← POST proxy: auth check → add X-User-ID → call FastAPI
│   └── session/
│       └── page.tsx                   ← client component: session state machine
├── components/
│   ├── HebrewWord.tsx                 ← RTL span with font + optional niqqud strip
│   ├── ExerciseCard.tsx               ← adaptive card: renders MC | flashcard | typing
│   ├── RatingBar.tsx                  ← 4 FSRS rating buttons (Again/Hard/Good/Easy)
│   └── SessionProgress.tsx           ← progress bar (done/total)
└── lib/
    └── api.ts                         ← typed fetch helpers: getNextCards(), submitReview()
```

---

## Task 1: Backend infrastructure

**Files:**
- Create: `backend/db.py`
- Create: `backend/models.py`
- Modify: `backend/requirements.txt`
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Add test dependencies to `backend/requirements.txt`**

Append to existing file:

```
pytest==8.3.4
httpx==0.28.1
pytest-mock==3.14.0
```

- [ ] **Step 2: Create `backend/db.py`**

```python
import os
import psycopg2
from psycopg2.pool import ThreadedConnectionPool

_pool: ThreadedConnectionPool | None = None


def _get_pool() -> ThreadedConnectionPool:
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(1, 10, dsn=os.environ["DATABASE_URL"])
    return _pool


def db_connection():
    conn = _get_pool().getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _get_pool().putconn(conn)
```

- [ ] **Step 3: Create `backend/models.py`**

```python
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
```

- [ ] **Step 4: Create `backend/tests/__init__.py`** (empty file)

```bash
mkdir -p backend/tests && touch backend/tests/__init__.py
```

- [ ] **Step 5: Create `backend/tests/conftest.py`**

```python
import pytest
from unittest.mock import MagicMock, patch
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
```

- [ ] **Step 6: Verify imports work**

```bash
cd backend && pip install -r requirements.txt && python -c "from db import db_connection; from models import Word; print('OK')"
```

Expected: `OK`

- [ ] **Step 7: Commit**

```bash
git add backend/db.py backend/models.py backend/requirements.txt backend/tests/
git commit -m "feat: backend db pool, pydantic models, test infrastructure"
```

---

## Task 2: FSRS scheduling service

**Files:**
- Create: `backend/fsrs_service.py`
- Create: `backend/tests/test_fsrs_service.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_fsrs_service.py`**

```python
import pytest
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
    new_state = schedule_review(state, rating=1)
    assert new_state["reps"] >= 1
    # stability after Again should be lower than after Easy
    state2 = {}
    easy_state = schedule_review(state2, rating=4)
    assert easy_state["stability"] > new_state["stability"]


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
    from fsrs import Card as FSRSCard
    card = FSRSCard()
    state = card_to_fsrs_state(card)
    card2 = fsrs_state_to_card(state)
    assert card2.reps == card.reps
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && python -m pytest tests/test_fsrs_service.py -v 2>&1 | head -20
```

Expected: `ImportError: cannot import name 'fsrs_state_to_card' from 'fsrs_service'`

- [ ] **Step 3: Create `backend/fsrs_service.py`**

```python
from datetime import datetime
from fsrs import Scheduler, Card as FSRSCard, Rating, State

_scheduler = Scheduler()

_RATING_MAP = {1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy}


def fsrs_state_to_card(state: dict) -> FSRSCard:
    card = FSRSCard()
    if not state:
        return card
    card.stability = state.get("stability", 0.0)
    card.difficulty = state.get("difficulty", 0.0)
    card.elapsed_days = state.get("elapsed_days", 0)
    card.scheduled_days = state.get("scheduled_days", 0)
    card.reps = state.get("reps", 0)
    card.lapses = state.get("lapses", 0)
    card.state = State(state.get("state", 0))
    last_review = state.get("last_review")
    if last_review:
        card.last_review = datetime.fromisoformat(last_review)
    return card


def card_to_fsrs_state(card: FSRSCard) -> dict:
    return {
        "stability": card.stability,
        "difficulty": card.difficulty,
        "elapsed_days": card.elapsed_days,
        "scheduled_days": card.scheduled_days,
        "reps": card.reps,
        "lapses": card.lapses,
        "state": card.state.value,
        "last_review": card.last_review.isoformat() if card.last_review else None,
        "due": card.due.isoformat() if hasattr(card, "due") and card.due else None,
    }


def schedule_review(fsrs_state: dict, rating: int) -> dict:
    card = fsrs_state_to_card(fsrs_state)
    card, _ = _scheduler.review_card(card, _RATING_MAP[rating])
    return card_to_fsrs_state(card)


def determine_format(fsrs_state: dict, format_override: str | None) -> str:
    if format_override:
        return format_override
    reps = fsrs_state.get("reps", 0) if fsrs_state else 0
    if reps == 0:
        return "multiple_choice"
    if reps <= 3:
        return "flashcard"
    # alternate between flashcard and typing for advanced cards
    return "typing" if reps % 2 == 0 else "flashcard"
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
cd backend && python -m pytest tests/test_fsrs_service.py -v
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/fsrs_service.py backend/tests/test_fsrs_service.py
git commit -m "feat: fsrs scheduling service with py-fsrs wrapper"
```

---

## Task 3: AI content generation service

**Files:**
- Create: `backend/ai_service.py`
- Create: `backend/tests/test_ai_service.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_ai_service.py`**

```python
import json
import pytest
from unittest.mock import patch, MagicMock
from models import Word
from ai_service import hash_prompt, generate_content


@pytest.fixture
def sample_word():
    return Word(
        id=14,
        hebrew="אֶרֶץ",
        transliteration="erets",
        gloss_pt="terra / país",
        morphology={"class": "noun", "gender": "f"},
        frequency_rank=14,
        source_reference="Gn 1:1",
    )


def test_hash_prompt_is_deterministic(sample_word):
    h1 = hash_prompt(sample_word.id, "flashcard", "claude")
    h2 = hash_prompt(sample_word.id, "flashcard", "claude")
    assert h1 == h2


def test_hash_prompt_differs_by_format(sample_word):
    h1 = hash_prompt(sample_word.id, "flashcard", "claude")
    h2 = hash_prompt(sample_word.id, "multiple_choice", "claude")
    assert h1 != h2


def test_generate_content_multiple_choice(sample_word):
    mock_response = {
        "question": "O que significa אֶרֶץ?",
        "options": ["terra", "céu", "água", "fogo"],
        "correct_index": 0,
        "explanation": "אֶרֶץ (erets) significa terra ou país",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.litellm.completion", return_value=mock):
        result = generate_content(sample_word, "multiple_choice")

    assert result["correct_index"] == 0
    assert len(result["options"]) == 4


def test_generate_content_flashcard(sample_word):
    mock_response = {
        "example_sentence": "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
        "translation": "No princípio Deus criou os céus e a terra",
        "note": "Substantivo feminino, raiz א-ר-ץ",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.litellm.completion", return_value=mock):
        result = generate_content(sample_word, "flashcard")

    assert "example_sentence" in result
    assert "translation" in result


def test_generate_content_typing(sample_word):
    mock_response = {
        "prompt": "Como se escreve 'terra' em hebraico?",
        "answer": "אֶרֶץ",
        "hint": "Começa com aleph (א)",
    }
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(mock_response)

    with patch("ai_service.litellm.completion", return_value=mock):
        result = generate_content(sample_word, "typing")

    assert result["answer"] == "אֶרֶץ"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && python -m pytest tests/test_ai_service.py -v 2>&1 | head -10
```

Expected: `ImportError`

- [ ] **Step 3: Create `backend/ai_service.py`**

```python
import hashlib
import json
import os
import litellm
from models import Word

_DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def hash_prompt(word_id: int, exercise_format: str, provider: str) -> str:
    key = f"{word_id}:{exercise_format}:{provider}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def _build_prompt(word: Word, exercise_format: str) -> str:
    word_json = json.dumps(
        {
            "hebrew": word.hebrew,
            "transliteration": word.transliteration,
            "gloss_pt": word.gloss_pt,
            "morphology": word.morphology,
            "source_reference": word.source_reference,
        },
        ensure_ascii=False,
    )
    if exercise_format == "multiple_choice":
        return f"""Gere um exercício de múltipla escolha para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- question: string (em português, ex: "O que significa X?")
- options: array de 4 strings (traduções em português; resposta correta SEMPRE na posição 0)
- correct_index: 0
- explanation: string (breve nota etimológica ou dica mnemônica em português)

Retorne apenas o objeto JSON, sem markdown."""

    if exercise_format == "flashcard":
        return f"""Gere contexto de flashcard para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- example_sentence: string (frase bíblica curta em hebraico usando esta palavra, com niqqud)
- translation: string (tradução portuguesa da frase)
- note: string (nota morfológica breve em português, ex: "Substantivo masculino, raiz ד-ב-ר")

Retorne apenas o objeto JSON, sem markdown."""

    # typing
    return f"""Gere um exercício de digitação para esta palavra do hebraico bíblico:
{word_json}

Retorne um objeto JSON com estes campos exatos:
- prompt: string (em português, ex: "Como se escreve 'terra' em hebraico?")
- answer: string (a palavra hebraica com niqqud)
- hint: string (nome da primeira letra, ex: "Começa com aleph (א)")

Retorne apenas o objeto JSON, sem markdown."""


def generate_content(word: Word, exercise_format: str, model: str | None = None) -> dict:
    prompt = _build_prompt(word, exercise_format)
    response = litellm.completion(
        model=model or os.environ.get("DEFAULT_AI_MODEL", _DEFAULT_MODEL),
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    text = response.choices[0].message.content.strip()
    return json.loads(text)
```

- [ ] **Step 4: Run tests and confirm they pass**

```bash
cd backend && python -m pytest tests/test_ai_service.py -v
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/ai_service.py backend/tests/test_ai_service.py
git commit -m "feat: ai content generation service with litellm and prompt caching"
```

---

## Task 4: Session router

**Files:**
- Create: `backend/session_router.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_session_router.py`

- [ ] **Step 1: Write failing tests in `backend/tests/test_session_router.py`**

```python
import json
import pytest
from unittest.mock import MagicMock, patch
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


def _make_card_row(word_id=14, card_id=1, reps=0):
    return (
        card_id,           # cards.id
        "test_user",       # user_id
        word_id,           # word_id
        {},                # fsrs_state
        None,              # format_override
        word_id,           # words.id
        "אֶרֶץ",            # hebrew
        "erets",           # transliteration
        "terra",           # gloss_pt
        {"class": "noun"}, # morphology
        14,                # frequency_rank
        "Gn 1:1",          # source_reference
    )


def test_get_next_cards_returns_cards(client, mock_cursor):
    # due cards query
    mock_cursor.fetchall.side_effect = [
        [_make_card_row()],  # due cards
        [],                  # new words (none needed)
    ]
    mock_cursor.fetchone.return_value = (5,)  # daily_new_limit

    ai_content = {"question": "O que é?", "options": ["terra", "a", "b", "c"], "correct_index": 0, "explanation": "..."}
    mock_cursor.fetchone.side_effect = [
        (5,),                          # user_settings
        (json.dumps(ai_content),),     # ai cache hit
    ]

    response = client.get("/session/next-cards", headers={"X-User-ID": "test_user"})
    assert response.status_code == 200
    data = response.json()
    assert "cards" in data
    assert "session_size" in data


def test_get_next_cards_missing_user_id(client):
    response = client.get("/session/next-cards")
    assert response.status_code == 422


def test_submit_review_updates_state(client, mock_cursor):
    existing_state = {}
    mock_cursor.fetchone.return_value = (
        1, "test_user", 14, existing_state, None
    )

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
    mock_cursor.fetchone.return_value = (
        1, "other_user", 14, {}, None
    )
    response = client.post(
        "/session/review",
        json={"card_id": 1, "rating": 3, "format_used": "flashcard"},
        headers={"X-User-ID": "test_user"},
    )
    assert response.status_code == 403
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && python -m pytest tests/test_session_router.py -v 2>&1 | head -15
```

Expected: import errors or 404s

- [ ] **Step 3: Create `backend/session_router.py`**

```python
import json
from fastapi import APIRouter, Depends, Header, HTTPException
from db import db_connection
from models import Word, CardWithContent, NextCardsResponse, ReviewRequest, ReviewResponse
from fsrs_service import schedule_review, determine_format
from ai_service import generate_content, hash_prompt

router = APIRouter(prefix="/session", tags=["session"])

_DEFAULT_PROVIDER = "claude"
_DEFAULT_NEW_LIMIT = 5


def _row_to_word(row: tuple) -> tuple[int, int, dict, str | None, Word]:
    """Parse a joined cards+words row into (card_id, reps, fsrs_state, format_override, Word)."""
    card_id, user_id, word_id, fsrs_state, format_override = row[:5]
    w_id, hebrew, transliteration, gloss_pt, morphology, frequency_rank, source_ref = row[5:]
    word = Word(
        id=w_id,
        hebrew=hebrew,
        transliteration=transliteration,
        gloss_pt=gloss_pt,
        morphology=morphology or {},
        frequency_rank=frequency_rank,
        source_reference=source_ref,
    )
    return card_id, fsrs_state or {}, format_override, word


def _get_or_generate_content(cur, word: Word, fmt: str, provider: str) -> dict:
    prompt_hash = hash_prompt(word.id, fmt, provider)
    cur.execute(
        "SELECT content FROM ai_content_cache WHERE word_id = %s AND provider = %s AND prompt_hash = %s",
        (word.id, provider, prompt_hash),
    )
    cached = cur.fetchone()
    if cached:
        return cached[0] if isinstance(cached[0], dict) else json.loads(cached[0])

    content = generate_content(word, fmt)
    cur.execute(
        """
        INSERT INTO ai_content_cache (word_id, provider, prompt_hash, content)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (word_id, provider, prompt_hash) DO NOTHING
        """,
        (word.id, provider, prompt_hash, json.dumps(content)),
    )
    return content


@router.get("/next-cards", response_model=NextCardsResponse)
def get_next_cards(
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        # User settings
        cur.execute(
            "SELECT daily_new_limit, preferred_provider FROM user_settings WHERE user_id = %s",
            (x_user_id,),
        )
        settings_row = cur.fetchone()
        new_limit = settings_row[0] if settings_row else _DEFAULT_NEW_LIMIT
        provider = settings_row[1] if settings_row else _DEFAULT_PROVIDER

        # Due cards
        cur.execute(
            """
            SELECT c.id, c.user_id, c.word_id, c.fsrs_state, c.format_override,
                   w.id, w.hebrew, w.transliteration, w.gloss_pt, w.morphology,
                   w.frequency_rank, w.source_reference
            FROM cards c
            JOIN words w ON c.word_id = w.id
            WHERE c.user_id = %s
              AND (c.fsrs_state->>'due') IS NOT NULL
              AND (c.fsrs_state->>'due')::timestamptz <= NOW()
            ORDER BY (c.fsrs_state->>'due')::timestamptz
            LIMIT 20
            """,
            (x_user_id,),
        )
        due_rows = cur.fetchall()

        # New words (not yet in cards for this user)
        new_needed = max(0, new_limit - len(due_rows))
        new_rows: list = []
        if new_needed > 0:
            cur.execute(
                """
                SELECT w.id, w.hebrew, w.transliteration, w.gloss_pt, w.morphology,
                       w.frequency_rank, w.source_reference
                FROM words w
                WHERE w.id NOT IN (SELECT word_id FROM cards WHERE user_id = %s)
                ORDER BY w.frequency_rank NULLS LAST
                LIMIT %s
                """,
                (x_user_id, new_needed),
            )
            new_word_rows = cur.fetchall()

            for word_row in new_word_rows:
                w = Word(
                    id=word_row[0],
                    hebrew=word_row[1],
                    transliteration=word_row[2],
                    gloss_pt=word_row[3],
                    morphology=word_row[4] or {},
                    frequency_rank=word_row[5],
                    source_reference=word_row[6],
                )
                cur.execute(
                    """
                    INSERT INTO cards (user_id, word_id, fsrs_state)
                    VALUES (%s, %s, '{}')
                    ON CONFLICT (user_id, word_id) DO NOTHING
                    RETURNING id
                    """,
                    (x_user_id, w.id),
                )
                result = cur.fetchone()
                if result:
                    new_rows.append((result[0], x_user_id, w.id, {}, None) + word_row)

        cards_out: list[CardWithContent] = []
        for row in due_rows + new_rows:
            card_id, fsrs_state, format_override, word = _row_to_word(row)
            fmt = determine_format(fsrs_state, format_override)
            content = _get_or_generate_content(cur, word, fmt, provider)
            cards_out.append(CardWithContent(card_id=card_id, word=word, format=fmt, content=content))

    return NextCardsResponse(cards=cards_out, session_size=len(cards_out))


@router.post("/review", response_model=ReviewResponse)
def submit_review(
    body: ReviewRequest,
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, user_id, word_id, fsrs_state, format_override FROM cards WHERE id = %s",
            (body.card_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Card not found")
        card_id, owner_id, word_id, fsrs_state, _ = row
        if owner_id != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        new_state = schedule_review(fsrs_state or {}, body.rating)

        cur.execute(
            "UPDATE cards SET fsrs_state = %s, last_reviewed_at = NOW() WHERE id = %s",
            (json.dumps(new_state), card_id),
        )
        cur.execute(
            """
            INSERT INTO review_log (card_id, user_id, rating, exercise_format_used, response_time_ms)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (card_id, x_user_id, body.rating, body.format_used, body.response_time_ms),
        )

    return ReviewResponse(
        next_due=new_state["due"] or "",
        new_stability=new_state["stability"],
        new_difficulty=new_state["difficulty"],
        new_reps=new_state["reps"],
    )
```

- [ ] **Step 4: Modify `backend/main.py` to include session_router**

Add after the existing `app = FastAPI(...)` line:

```python
from session_router import router as session_router
app.include_router(session_router)
```

Full updated `backend/main.py`:

```python
from fastapi import FastAPI
from session_router import router as session_router

app = FastAPI(title="hebrai API", version="0.1.0")
app.include_router(session_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 5: Run tests**

```bash
cd backend && python -m pytest tests/test_session_router.py -v
```

Expected: all 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/session_router.py backend/main.py backend/tests/test_session_router.py
git commit -m "feat: session router — next-cards and review endpoints with FSRS + AI"
```

---

## Task 5: Next.js API proxy routes

**Files:**
- Create: `frontend/src/app/api/session/next-cards/route.ts`
- Create: `frontend/src/app/api/session/review/route.ts`
- Create: `frontend/src/lib/api.ts`

- [ ] **Step 1: Create `frontend/src/app/api/session/next-cards/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${fastapiUrl}/session/next-cards`, {
    headers: { "X-User-ID": session.user.id },
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
```

- [ ] **Step 2: Create `frontend/src/app/api/session/review/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const fastapiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

  const upstream = await fetch(`${fastapiUrl}/session/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": session.user.id,
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
```

- [ ] **Step 3: Create `frontend/src/lib/api.ts`**

```typescript
export interface Word {
  id: number;
  hebrew: string;
  transliteration: string;
  gloss_pt: string;
  morphology: Record<string, unknown>;
  frequency_rank: number | null;
  source_reference: string | null;
}

export interface CardWithContent {
  card_id: number;
  word: Word;
  format: "multiple_choice" | "flashcard" | "typing";
  content: Record<string, unknown>;
}

export interface NextCardsResponse {
  cards: CardWithContent[];
  session_size: number;
}

export interface ReviewRequest {
  card_id: number;
  rating: 1 | 2 | 3 | 4;
  format_used: string;
  response_time_ms?: number;
}

export interface ReviewResponse {
  next_due: string;
  new_stability: number;
  new_difficulty: number;
  new_reps: number;
}

export async function getNextCards(): Promise<NextCardsResponse> {
  const res = await fetch("/api/session/next-cards");
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return res.json();
}

export async function submitReview(body: ReviewRequest): Promise<ReviewResponse> {
  const res = await fetch("/api/session/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to submit review: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/api/session/ frontend/src/lib/api.ts
git commit -m "feat: next.js api proxy routes for session endpoints"
```

---

## Task 6: HebrewWord component

**Files:**
- Create: `frontend/src/components/HebrewWord.tsx`

- [ ] **Step 1: Create `frontend/src/components/HebrewWord.tsx`**

```typescript
interface HebrewWordProps {
  text: string;
  showNiqqud?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

function stripNiqqud(text: string): string {
  // Remove Hebrew vowel points (U+05B0–U+05C7) and cantillation marks (U+0591–U+05AF)
  return text.replace(/[֑-ׇ]/g, "");
}

export function HebrewWord({
  text,
  showNiqqud = true,
  className = "",
  size = "md",
}: HebrewWordProps) {
  const displayed = showNiqqud ? text : stripNiqqud(text);
  return (
    <span
      dir="rtl"
      lang="he"
      className={`font-serif ${SIZE_CLASSES[size]} leading-loose tracking-wide ${className}`}
    >
      {displayed}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/HebrewWord.tsx
git commit -m "feat: HebrewWord component with RTL, niqqud toggle, and size variants"
```

---

## Task 7: ExerciseCard, RatingBar, SessionProgress

**Files:**
- Create: `frontend/src/components/RatingBar.tsx`
- Create: `frontend/src/components/SessionProgress.tsx`
- Create: `frontend/src/components/ExerciseCard.tsx`

- [ ] **Step 1: Create `frontend/src/components/RatingBar.tsx`**

```typescript
import { Button } from "@/components/ui/button";

interface RatingBarProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const RATINGS: { value: 1 | 2 | 3 | 4; label: string; variant: "destructive" | "outline" | "secondary" | "default" }[] = [
  { value: 1, label: "Errei", variant: "destructive" },
  { value: 2, label: "Difícil", variant: "outline" },
  { value: 3, label: "Bom", variant: "secondary" },
  { value: 4, label: "Fácil", variant: "default" },
];

export function RatingBar({ onRate, disabled = false }: RatingBarProps) {
  return (
    <div className="flex gap-2 justify-center w-full">
      {RATINGS.map(({ value, label, variant }) => (
        <Button
          key={value}
          variant={variant}
          onClick={() => onRate(value)}
          disabled={disabled}
          className="flex-1"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/SessionProgress.tsx`**

```typescript
interface SessionProgressProps {
  done: number;
  total: number;
}

export function SessionProgress({ done, total }: SessionProgressProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{done} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/ExerciseCard.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HebrewWord } from "./HebrewWord";
import { RatingBar } from "./RatingBar";
import type { CardWithContent } from "@/lib/api";

interface ExerciseCardProps {
  card: CardWithContent;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
}

function MultipleChoice({ card, onRate }: ExerciseCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const content = card.content as {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  };

  function handleSelect(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
  }

  const revealed = selected !== null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <HebrewWord text={card.word.hebrew} size="xl" />
        <p className="text-sm text-muted-foreground">{card.word.transliteration}</p>
      </div>
      <p className="text-center font-medium">{content.question}</p>
      <div className="grid grid-cols-2 gap-2">
        {content.options.map((opt, idx) => {
          const isCorrect = idx === content.correct_index;
          const isSelected = idx === selected;
          let variant: "outline" | "default" | "destructive" | "secondary" = "outline";
          if (revealed && isCorrect) variant = "default";
          else if (revealed && isSelected && !isCorrect) variant = "destructive";
          return (
            <Button key={idx} variant={variant} onClick={() => handleSelect(idx)}>
              {opt}
            </Button>
          );
        })}
      </div>
      {revealed && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">{content.explanation}</p>
          <RatingBar onRate={onRate} />
        </div>
      )}
    </div>
  );
}

function Flashcard({ card, onRate }: ExerciseCardProps) {
  const [revealed, setRevealed] = useState(false);
  const content = card.content as {
    example_sentence: string;
    translation: string;
    note: string;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <HebrewWord text={card.word.hebrew} size="xl" />
        <p className="text-sm text-muted-foreground">{card.word.transliteration}</p>
      </div>
      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Revelar
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-lg font-medium">{card.word.gloss_pt}</p>
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <HebrewWord text={content.example_sentence} size="sm" className="block text-right" />
            <p className="text-sm text-muted-foreground">{content.translation}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">{content.note}</p>
          <RatingBar onRate={onRate} />
        </div>
      )}
    </div>
  );
}

function TypingExercise({ card, onRate }: ExerciseCardProps) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const content = card.content as {
    prompt: string;
    answer: string;
    hint: string;
  };

  const correct = input.trim() === content.answer;

  return (
    <div className="space-y-6">
      <p className="text-center font-medium">{content.prompt}</p>
      <p className="text-xs text-muted-foreground text-center">{content.hint}</p>
      <Input
        dir="rtl"
        lang="he"
        className="text-center text-2xl font-serif"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={submitted}
        placeholder="Digite em hebraico…"
      />
      {!submitted ? (
        <Button className="w-full" onClick={() => setSubmitted(true)} disabled={!input.trim()}>
          Verificar
        </Button>
      ) : (
        <div className="space-y-3">
          {correct ? (
            <p className="text-center text-green-600 font-medium">Correto!</p>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-red-500">Incorreto</p>
              <p className="text-sm text-muted-foreground">
                Resposta: <HebrewWord text={content.answer} size="sm" />
              </p>
            </div>
          )}
          <RatingBar onRate={onRate} />
        </div>
      )}
    </div>
  );
}

export function ExerciseCard({ card, onRate }: ExerciseCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2" />
      <CardContent>
        {card.format === "multiple_choice" && <MultipleChoice card={card} onRate={onRate} />}
        {card.format === "flashcard" && <Flashcard card={card} onRate={onRate} />}
        {card.format === "typing" && <TypingExercise card={card} onRate={onRate} />}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Add missing shadcn/ui components if not yet installed**

```bash
cd frontend && npx shadcn@latest add card input && cd ..
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: ExerciseCard, RatingBar, SessionProgress components"
```

---

## Task 8: Session page

**Files:**
- Create: `frontend/src/app/session/page.tsx`

- [ ] **Step 1: Create `frontend/src/app/session/page.tsx`**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExerciseCard } from "@/components/ExerciseCard";
import { SessionProgress } from "@/components/SessionProgress";
import { Button } from "@/components/ui/button";
import { getNextCards, submitReview } from "@/lib/api";
import type { CardWithContent, ReviewRequest } from "@/lib/api";

type SessionState = "loading" | "active" | "empty" | "complete" | "error";

export default function SessionPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardWithContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<SessionState>("loading");
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  useEffect(() => {
    getNextCards()
      .then((data) => {
        if (data.cards.length === 0) {
          setState("empty");
        } else {
          setCards(data.cards);
          setTotal(data.session_size);
          setState("active");
          setStartedAt(Date.now());
        }
      })
      .catch(() => setState("error"));
  }, []);

  const handleRate = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      const card = cards[currentIndex];
      const body: ReviewRequest = {
        card_id: card.card_id,
        rating,
        format_used: card.format,
        response_time_ms: Date.now() - startedAt,
      };

      try {
        await submitReview(body);
      } catch {
        // non-fatal: continue session even if submit fails
      }

      const next = currentIndex + 1;
      setDone((d) => d + 1);
      setStartedAt(Date.now());

      if (next >= cards.length) {
        setState("complete");
      } else {
        setCurrentIndex(next);
      }
    },
    [cards, currentIndex, startedAt],
  );

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando sessão…</p>
      </main>
    );
  }

  if (state === "empty") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium">Nenhuma revisão pendente por hoje.</p>
        <p className="text-muted-foreground text-sm">Volte amanhã para continuar.</p>
        <Button onClick={() => router.push("/")}>Voltar ao início</Button>
      </main>
    );
  }

  if (state === "complete") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-semibold">Sessão concluída!</p>
        <p className="text-muted-foreground">{done} {done === 1 ? "palavra revisada" : "palavras revisadas"}</p>
        <Button onClick={() => router.push("/")}>Voltar ao início</Button>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Erro ao carregar a sessão.</p>
        <Button onClick={() => router.refresh()}>Tentar novamente</Button>
      </main>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <main className="min-h-screen p-4 flex flex-col items-center gap-6 max-w-lg mx-auto">
      <div className="w-full pt-4">
        <SessionProgress done={done} total={total} />
      </div>
      <ExerciseCard card={currentCard} onRate={handleRate} />
    </main>
  );
}
```

- [ ] **Step 2: Add a "Iniciar sessão" link to the dashboard shell**

Edit `frontend/src/app/page.tsx` — add a button below the existing content:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
// ... existing imports

// Inside the return, after the <p>:
<Link href="/session">
  <Button>Iniciar sessão</Button>
</Link>
```

Full updated `frontend/src/app/page.tsx`:

```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <main className="min-h-screen p-8 flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        שָׁלוֹם, {session.user.name ?? session.user.email}
      </h1>
      <p className="text-muted-foreground">Dashboard — em construção</p>
      <Link href="/session">
        <Button>Iniciar sessão</Button>
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Start dev server and manually test**

```bash
# Make sure postgres + fastapi are running:
docker compose up postgres fastapi -d
sleep 5

cd frontend && npm run dev &
```

Test flow:
1. Open `http://localhost:3000` → redirects to `/login`
2. Register + login
3. Click "Iniciar sessão" → goes to `/session`
4. First card should be `multiple_choice` (reps = 0)
5. Select an option → reveals answer + explanation + RatingBar
6. Click a rating → next card loads
7. After all cards → "Sessão concluída!"

Kill dev server: `kill %1`

```bash
docker compose down
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/session/ frontend/src/app/page.tsx
git commit -m "feat: session page with adaptive exercise flow"
```

---

## Task 9: End-to-end smoke test with Docker Compose

- [ ] **Step 1: Build all containers**

```bash
docker compose build
```

Expected: all images build without error.

- [ ] **Step 2: Start stack and run backend tests**

```bash
docker compose up postgres -d
sleep 5
DATABASE_URL=postgresql://hebrai:changeme@localhost:5432/hebrai \
  cd backend && python -m pytest tests/ -v && cd ..
```

Expected: all tests PASS.

- [ ] **Step 3: Full stack up, verify session endpoint**

```bash
docker compose up -d
sleep 10

# Health check
docker compose exec fastapi curl -s http://localhost:8000/health
# Expected: {"status":"ok"}

# Session endpoint (will 422 without X-User-ID header — expected)
docker compose exec fastapi curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/session/next-cards
# Expected: 422
```

- [ ] **Step 4: Tear down and final commit**

```bash
docker compose down
git add .
git commit -m "chore: end-to-end smoke test — core engine verified"
```

---

## Self-Review Checklist

- [x] Spec §5 (session flow) → GET /session/next-cards + POST /session/review (Tasks 4, 5)
- [x] Spec §5 (format selection: reps=0→MC, 1-3→flashcard, >3→flashcard/typing) → fsrs_service.determine_format() (Task 2)
- [x] Spec §5 (AI cache check before generate) → _get_or_generate_content() (Task 4)
- [x] Spec §7 (HebrewWord, ExerciseCard, RatingBar, SessionProgress) → Tasks 6, 7
- [x] Spec §8 (LiteLLM multi-provider) → ai_service.py with DEFAULT_AI_MODEL env var (Task 3)
- [x] Spec §9 (RTL, niqqud toggle) → HebrewWord component with stripNiqqud() and dir="rtl" (Task 6)
- [x] Spec §6 /session route → session page (Task 8)
- [x] Tests for all backend services (Tasks 2, 3, 4)
- [x] No TBDs, no placeholder steps
