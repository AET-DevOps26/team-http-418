from enum import StrEnum

from pydantic import BaseModel, Field


class CourseItem(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field()
    title_en: str = Field()
    title_ger: str = Field()
    description_en: str | None = None
    description_ger: str | None = None
    previous_knowledge_en: str | None = None
    previous_knowledge_ger: str | None = None
    course_objective_en: str | None = None
    course_objective_ger: str | None = None
    department: str | None = None


class EmbedMode(StrEnum):
    UPSERT = "UPSERT"
    FULL_REBUILD = "FULL_REBUILD"


class EmbedCoursesRequest(BaseModel):
    courses: list[CourseItem]
    mode: EmbedMode = EmbedMode.UPSERT
