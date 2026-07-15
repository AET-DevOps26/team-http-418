import logging

from db import get_connection

logger = logging.getLogger("genai")


def find_similar_courses(
    query_vector: list[float],
    candidate_ids: list[int],
    limit: int,
    study_program_id: int = 0,
) -> list[tuple[int, float]]:
    """Vector similarity search restricted to candidate_ids. Returns (course_id, score) pairs."""
    if not candidate_ids:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                    SELECT e.course_id,
                           1 - (e.embedding <=> %(vector)s::vector) AS score
                    FROM course_embeddings e {
                    "JOIN courses c ON e.course_id = c.id JOIN curriculum_connections cc ON c.id = cc.course_id WHERE cc.curriculum_version_id = %(study_program_id)s"
                    if study_program_id
                    else ""
                }
                    ORDER BY e.embedding <=> %(vector)s::vector
                    LIMIT %(limit)s
                    """,
                {"vector": query_vector, "limit": limit, "study_program_id": study_program_id},
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
