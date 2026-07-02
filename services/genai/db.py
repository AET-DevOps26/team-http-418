import logging
import os

import psycopg2
from pgvector.psycopg2 import register_vector
from psycopg2 import DatabaseError, OperationalError

logger = logging.getLogger("genai")

DB_NAME = os.environ["COURSES_DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASS = os.environ["DB_PASS"]
DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]

_schema_initialized = False


def get_connection():
    conn = psycopg2.connect(user=DB_USER, password=DB_PASS, database=DB_NAME, host=DB_HOST, port=DB_PORT)
    try:
        register_vector(conn)
    except psycopg2.ProgrammingError as e:
        # This catches "vector type not found". It allows init_schema to run
        # its CREATE EXTENSION command without failing or logging scary warnings.
        if "vector" in str(e):
            conn.rollback()
        else:
            conn.rollback()
            raise e
    return conn


def init_schema(dimensions: int = 4096) -> bool:
    """Enable pgvector extension and create course_embeddings table if not exists."""
    global _schema_initialized

    try:
        # 1. This call will now succeed even if the extension doesn't exist yet
        with get_connection() as conn:
            with conn.cursor() as cur:
                # 2. Create the extension safely
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
                # 3. Create the table structure
                cur.execute(f"""
                    CREATE TABLE IF NOT EXISTS course_embeddings (
                        course_id BIGINT PRIMARY KEY,
                        embedding VECTOR({dimensions}),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    )
                """)
            conn.commit()

            # 4. Force registration onto THIS specific startup connection now that the type exists
            register_vector(conn)

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
