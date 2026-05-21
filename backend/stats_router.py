from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from db import db_connection

router = APIRouter(prefix="/stats", tags=["stats"])


class DailyStats(BaseModel):
    reviews_today: int
    new_words_today: int
    retention_rate: float  # percentage 0–100
    streak_days: int


@router.get("/daily", response_model=DailyStats)
def daily_stats(
    x_user_id: str = Header(...),
    conn=Depends(db_connection),
):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) FROM review_log
            WHERE user_id = %s AND reviewed_at >= CURRENT_DATE
            """,
            (x_user_id,),
        )
        reviews_today = cur.fetchone()[0]

        cur.execute(
            """
            SELECT COUNT(*) FROM cards
            WHERE user_id = %s AND created_at >= CURRENT_DATE
            """,
            (x_user_id,),
        )
        new_words_today = cur.fetchone()[0]

        cur.execute(
            """
            SELECT
                ROUND(
                    100.0 * SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(*), 0),
                    1
                )
            FROM review_log
            WHERE user_id = %s
              AND reviewed_at >= NOW() - INTERVAL '30 days'
            """,
            (x_user_id,),
        )
        retention_row = cur.fetchone()[0]
        retention_rate = float(retention_row) if retention_row is not None else 0.0

        cur.execute(
            """
            WITH daily_reviews AS (
                SELECT DISTINCT DATE(reviewed_at) AS review_date
                FROM review_log
                WHERE user_id = %s
            ),
            streak AS (
                SELECT review_date,
                       review_date - (ROW_NUMBER() OVER (ORDER BY review_date))::int AS grp
                FROM daily_reviews
            )
            SELECT COUNT(*) FROM streak
            WHERE grp = (
                SELECT grp FROM streak
                ORDER BY review_date DESC
                LIMIT 1
            )
            """,
            (x_user_id,),
        )
        streak_row = cur.fetchone()
        streak_days = int(streak_row[0]) if streak_row else 0

    return DailyStats(
        reviews_today=reviews_today,
        new_words_today=new_words_today,
        retention_rate=retention_rate,
        streak_days=streak_days,
    )
