-- Better Auth manages its own tables (users, sessions, accounts, verifications)
-- We manage the application tables below.

CREATE TABLE IF NOT EXISTS words (
    id              SERIAL PRIMARY KEY,
    hebrew          TEXT NOT NULL,
    transliteration TEXT NOT NULL,
    gloss_pt        TEXT NOT NULL,
    morphology      JSONB NOT NULL DEFAULT '{}',
    frequency_rank  INT,
    source_reference TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
    id               SERIAL PRIMARY KEY,
    user_id          TEXT NOT NULL,        -- references Better Auth users.id
    word_id          INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    fsrs_state       JSONB NOT NULL DEFAULT '{}',
    format_override  TEXT CHECK (format_override IN ('flashcard', 'multiple_choice', 'typing')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    UNIQUE (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS review_log (
    id                   SERIAL PRIMARY KEY,
    card_id              INT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id              TEXT NOT NULL,
    rating               INT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    exercise_format_used TEXT NOT NULL,
    response_time_ms     INT,
    reviewed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_content_cache (
    id          SERIAL PRIMARY KEY,
    word_id     INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    provider    TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    content     JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (word_id, provider, prompt_hash)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id            TEXT PRIMARY KEY,   -- references Better Auth users.id
    preferred_provider TEXT NOT NULL DEFAULT 'claude',
    fsrs_params        JSONB NOT NULL DEFAULT '{}',
    daily_new_limit    INT NOT NULL DEFAULT 5,
    show_niqqud        BOOLEAN NOT NULL DEFAULT TRUE,
    timezone           TEXT NOT NULL DEFAULT 'America/Sao_Paulo'
);

-- Indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON cards(user_id, (fsrs_state->>'due'));
CREATE INDEX IF NOT EXISTS idx_review_log_card ON review_log(card_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON ai_content_cache(word_id, provider, prompt_hash);
