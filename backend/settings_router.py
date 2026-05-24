from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field, field_validator
from db import db_connection

router = APIRouter(prefix="/settings", tags=["settings"])

_VALID_PROVIDERS = frozenset({"claude", "gpt-4o", "gemini", "ollama"})
_TIMEZONE_MAX_LENGTH = 64


class UserSettings(BaseModel):
    preferred_provider: str = "claude"
    daily_new_limit: int = Field(default=5, ge=1, le=500)
    show_niqqud: bool = True
    timezone: str = "America/Sao_Paulo"

    @field_validator("preferred_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in _VALID_PROVIDERS:
            raise ValueError(f"provider must be one of {sorted(_VALID_PROVIDERS)}")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        if len(v) > _TIMEZONE_MAX_LENGTH:
            raise ValueError(f"timezone must be at most {_TIMEZONE_MAX_LENGTH} characters")
        try:
            ZoneInfo(v)
        except (ZoneInfoNotFoundError, KeyError):
            raise ValueError(f"unknown timezone: {v!r}")
        return v


@router.get("", response_model=UserSettings)
def get_settings(
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT preferred_provider, daily_new_limit, show_niqqud, timezone"
            " FROM user_settings WHERE user_id = %s",
            (x_user_id,),
        )
        row = cur.fetchone()
    if not row:
        return UserSettings()
    return UserSettings(
        preferred_provider=row[0],
        daily_new_limit=row[1],
        show_niqqud=row[2],
        timezone=row[3],
    )


@router.put("", response_model=UserSettings)
def update_settings(
    body: UserSettings,
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO user_settings
                (user_id, preferred_provider, daily_new_limit, show_niqqud, timezone)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                preferred_provider = EXCLUDED.preferred_provider,
                daily_new_limit    = EXCLUDED.daily_new_limit,
                show_niqqud        = EXCLUDED.show_niqqud,
                timezone           = EXCLUDED.timezone
            """,
            (
                x_user_id,
                body.preferred_provider,
                body.daily_new_limit,
                body.show_niqqud,
                body.timezone,
            ),
        )
    return body
