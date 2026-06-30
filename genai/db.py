import logging
import os

import psycopg2
from pgvector.psycopg2 import register_vector
from psycopg2 import DatabaseError, OperationalError

logger = logging.getLogger("genai")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/courses-data")
_schema_initialized = False


def get_connection():
    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    return conn


def init_schema(dimensions: int = 4096) -> bool:
    """Enable pgvector extension and create course_embeddings table if not exists."""
    global _schema_initialized

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
        _schema_initialized = True
        logger.info("db | schema initialized (dimensions=%d)", dimensions)
        return True
    except OperationalError as e:
        logger.warning("db | connection failed (DB not ready?) — will retry on first request: %s", e)
    except DatabaseError as e:
        logger.warning("db | schema init failed — will retry on first request: %s", e)

    _schema_initialized = False
    return False


def ensure_schema_initialized(dimensions: int = 4096) -> None:
    if not _schema_initialized:
        init_schema(dimensions=dimensions)
