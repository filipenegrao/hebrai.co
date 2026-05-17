"""Import Biblical Hebrew words from CSV into PostgreSQL words table."""

import csv
import json
import os
import sys

import psycopg2


def seed_words(csv_path: str, database_url: str) -> None:
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()

        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        inserted = 0
        skipped = 0

        for row in rows:
            morphology = json.loads(row["morphology"]) if row["morphology"] else {}
            frequency_rank = int(row["frequency_rank"]) if row["frequency_rank"] else None
            source_reference = row["source_reference"] or None

            cur.execute(
                """
                INSERT INTO words (hebrew, transliteration, gloss_pt, morphology, frequency_rank, source_reference)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (hebrew) DO NOTHING
                """,
                (
                    row["hebrew"],
                    row["transliteration"],
                    row["gloss_pt"],
                    json.dumps(morphology),
                    frequency_rank,
                    source_reference,
                ),
            )
            if cur.rowcount:
                inserted += 1
            else:
                skipped += 1

        conn.commit()
        print(f"Seed complete: {inserted} inserted, {skipped} skipped.")
    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, "words.csv")
    database_url = os.environ["DATABASE_URL"]
    seed_words(csv_path, database_url)
