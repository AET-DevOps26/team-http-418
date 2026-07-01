from pydantic import BaseModel


class UnmatchedModule(BaseModel):
    module_id: str | None = None
    title_en: str | None = None
    title_de: str | None = None


class TranscriptMatchRequest(BaseModel):
    modules: list[UnmatchedModule]


class MatchedModule(BaseModel):
    module_id: str | None
    course_id: int
    score: float
    matched_title: str


class TranscriptMatchResponse(BaseModel):
    matches: list[MatchedModule]
    unmatched: list[str | None]
