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

    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT course_id,
                   1 - (embedding <=> %(vector)s::vector) AS score
            FROM course_embeddings
            WHERE course_id = ANY(%(ids)s)
            ORDER BY embedding <=> %(vector)s::vector
            LIMIT %(limit)s
            """,
            {"vector": query_vector, "ids": candidate_ids, "limit": limit},
        )
        return cursor.fetchall()
