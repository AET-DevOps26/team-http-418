import logging

from db import get_connection
from models.recommendations import CourseRef

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

def get_course_refs(rankings: list[tuple[int,float]]) -> list[tuple[CourseRef, float]]:
    if not rankings:
        return []

    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                c.id,
                ct.key,
                c.title_en,
                COALESCE(c.sws, 0) as sws,
                c.description_en, c.description_ger
            FROM courses c
            JOIN course_types ct ON c.course_type_id = ct.id
            WHERE c.id IN %(ids)s
            """,
            {"ids": tuple(map(lambda x: x[0], rankings))},
        )
        rows = cursor.fetchall()

        # credits are missing in the main courses table, estimating based on SWS
        # approximation from scraper: ECTS ≈ ROUND(SWS * 1.25 + 0.5)
        return [
            (CourseRef(
                courseId=row[0],
                courseCode=row[1],
                courseName=row[2],
                credits=int(round(row[3] * 1.25 + 0.5)) if row[3] else 0,
                description=row[4] if row[4] else row[5],
            ), next(filter(lambda ranking: ranking[0] == row[0], rankings))[1])
            for row in rows
        ]