from enum import StrEnum

from pydantic import BaseModel, Field


class CourseItem(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_name: str = Field(alias="courseName")
    description: str | None = None
    department: str | None = None
    language: str | None = None


class EmbedMode(StrEnum):
    UPSERT = "UPSERT"
    FULL_REBUILD = "FULL_REBUILD"


class EmbedCoursesRequest(BaseModel):
    courses: list[CourseItem]
    mode: EmbedMode = EmbedMode.UPSERT
