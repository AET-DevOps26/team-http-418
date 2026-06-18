import logging

from db import get_connection

logger = logging.getLogger("genai")


def find_similar_courses(
    query_vector: list[float],
    candidate_ids: list[int],
    limit: int,
) -> list[tuple[int, float]]:
    """Vector similarity search restricted to candidate_ids. Returns (course_id, score) pairs."""
    if not candidate_ids:
        return []

    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT course_id,
                   1 - (embedding <=> %s::vector) AS score
            FROM course_embeddings
            WHERE course_id = ANY(%s)
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (query_vector, candidate_ids, query_vector, limit),
        )
        return cur.fetchall()
