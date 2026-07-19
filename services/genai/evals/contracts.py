from typing import Literal

from pydantic import BaseModel, Field


class EvalCourse(BaseModel):
    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int
    category: str = "Elective"
    semester: str = "W"
    description: str = ""


class EvalCase(BaseModel):
    """Versioned, non-PII specification for a single golden evaluation case."""

    schema_version: Literal[1] = Field(alias="schemaVersion")
    id: str
    type: Literal["recommendations", "roadmap", "advisor", "retrieval"]
    profile: dict = {}
    request: dict = {}
    candidate_ids: list[int] = Field(default=[], alias="candidateIds")
    excluded_ids: list[int] = Field(default=[], alias="excludedIds")
    hard_rules: dict = Field(default={}, alias="hardRules")
    rubric: list[str] = []


class EvalSuite(BaseModel):
    schema_version: Literal[1] = Field(alias="schemaVersion")
    cases: list[EvalCase]
