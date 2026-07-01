import logging

from llm.embeddings import get_embeddings
from models.transcript import MatchedModule, TranscriptMatchRequest, TranscriptMatchResponse
from repositories.courses import search_courses

logger = logging.getLogger("genai")

SCORE_THRESHOLD = 0.5


def match_transcript_modules(request: TranscriptMatchRequest) -> TranscriptMatchResponse:
    embeddings = get_embeddings()
    matches = []
    unmatched = []

    for module in request.modules:
        query = module.title_en or module.title_de or module.module_id
        if not query:
            unmatched.append(module.module_id)
            continue

        try:
            vector = embeddings.embed_query(query)
            results = search_courses(vector, limit=3)
            if results and results[0][1] >= SCORE_THRESHOLD:
                course_id, score = results[0]
                matches.append(
                    MatchedModule(
                        module_id=module.module_id,
                        course_id=course_id,
                        score=score,
                        matched_title=str(course_id),
                    )
                )
            else:
                unmatched.append(module.module_id)
        except Exception as e:
            logger.error("transcript match error for %s: %s", module.module_id, e)
            unmatched.append(module.module_id)

    return TranscriptMatchResponse(matches=matches, unmatched=unmatched)
