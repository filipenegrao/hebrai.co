import json
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException

from db import db_connection
from models import Word, CardWithContent, NextCardsResponse, ReviewRequest, ReviewResponse
from fsrs_service import schedule_review, determine_format
from ai_service import generate_content, hash_prompt

router = APIRouter(prefix="/session", tags=["session"])

_DEFAULT_PROVIDER = "claude"
_DEFAULT_NEW_LIMIT = 5


def _validate_fsrs_state(fsrs_state: Any, card_id: int) -> dict:
    """Validate DB-sourced fsrs_state before it reaches fsrs_state_to_card()."""
    if not isinstance(fsrs_state, dict):
        raise HTTPException(
            status_code=422,
            detail=f"Card {card_id}: fsrs_state must be an object, got {type(fsrs_state).__name__}",
        )
    for field in ("due", "last_review"):
        val = fsrs_state.get(field)
        if val is not None:
            try:
                datetime.fromisoformat(str(val))
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=422,
                    detail=f"Card {card_id}: fsrs_state.{field} is not a valid ISO datetime",
                )
    return fsrs_state


def _row_to_parts(row: tuple) -> tuple[int, dict, str | None, Word]:
    """Unpack a joined cards+words DB row."""
    card_id, _user_id, _word_id, fsrs_state, format_override = row[:5]
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
        raw = cached[0]
        return raw if isinstance(raw, dict) else json.loads(raw)

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
        cur.execute(
            "SELECT daily_new_limit, preferred_provider FROM user_settings WHERE user_id = %s",
            (x_user_id,),
        )
        settings = cur.fetchone()
        new_limit = settings[0] if settings else _DEFAULT_NEW_LIMIT
        provider = settings[1] if settings else _DEFAULT_PROVIDER

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
            for wr in cur.fetchall():
                word = Word(
                    id=wr[0], hebrew=wr[1], transliteration=wr[2], gloss_pt=wr[3],
                    morphology=wr[4] or {}, frequency_rank=wr[5], source_reference=wr[6],
                )
                cur.execute(
                    """
                    INSERT INTO cards (user_id, word_id, fsrs_state)
                    VALUES (%s, %s, '{}')
                    ON CONFLICT (user_id, word_id) DO NOTHING
                    RETURNING id
                    """,
                    (x_user_id, word.id),
                )
                result = cur.fetchone()
                if result:
                    new_rows.append((result[0], x_user_id, word.id, {}, None) + wr)

        cards_out: list[CardWithContent] = []
        for row in due_rows + new_rows:
            card_id, fsrs_state, format_override, word = _row_to_parts(row)
            fsrs_state = _validate_fsrs_state(fsrs_state, card_id)
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
            "SELECT id, user_id, word_id, fsrs_state FROM cards WHERE id = %s",
            (body.card_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Card not found")
        card_id, owner_id, _word_id, fsrs_state = row
        if owner_id != x_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        fsrs_state = _validate_fsrs_state(fsrs_state or {}, card_id)
        new_state = schedule_review(fsrs_state, body.rating)

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

    stability = new_state.get("stability")
    difficulty = new_state.get("difficulty")
    return ReviewResponse(
        next_due=new_state.get("due") or "",
        new_stability=stability if stability is not None else 0.0,
        new_difficulty=difficulty if difficulty is not None else 0.0,
        new_reps=new_state.get("reps", 0),
    )
