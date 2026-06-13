import logging
import os

import psycopg2
from pgvector.psycopg2 import register_vector

logger = logging.getLogger("genai")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/courses-data")


def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    return conn


def init_schema(dimensions: int = 4096) -> None:
    """Enable pgvector extension and create course_embeddings table if not exists."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS course_embeddings (
                        course_id BIGINT PRIMARY KEY,
                        embedding VECTOR({dimensions}),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    )
                """)
            conn.commit()
        logger.info("db | schema initialized (dimensions=%d)", dimensions)
    except Exception as e:
        logger.warning("db | schema init failed — will retry on first request: %s", e)
