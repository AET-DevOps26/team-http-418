import logging

from db import get_connection

logger = logging.getLogger("genai")


def search_courses(query_vector: list[float], limit: int) -> list[tuple[int, float]]:
    """Global vector similarity search. Returns (course_id, score) pairs."""
    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT course_id,
                   1 - (embedding <=> %(vector)s::vector) AS score
            FROM course_embeddings
            ORDER BY embedding <=> %(vector)s::vector
            LIMIT %(limit)s
            """,
            {"vector": query_vector, "limit": limit},
        )
        return cursor.fetchall()
