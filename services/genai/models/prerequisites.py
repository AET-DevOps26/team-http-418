from __future__ import annotations

from pydantic import BaseModel, Field


class AvailableCourse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_name: str = Field(alias="courseName")


class PrerequisiteExtractRequest(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_name: str = Field(alias="courseName")
    previous_knowledge_text: str = Field(alias="previousKnowledgeText")
    available_courses: list[AvailableCourse] = Field(alias="availableCourses")


class PrerequisiteCourseRequest(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_name: str = Field(alias="courseName")
    previous_knowledge_text: str = Field(alias="previousKnowledgeText")


class PrerequisiteExtractBatchRequest(BaseModel):
    model_config = {"populate_by_name": True}

    courses: list[PrerequisiteCourseRequest]
    available_courses: list[AvailableCourse] = Field(alias="availableCourses")


class PrerequisiteNodeResponse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    type: str
    prerequisites: list[PrerequisiteNodeResponse] = Field(default=[])


class PrerequisiteExtractResponse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    prerequisites: list[PrerequisiteNodeResponse] = Field(default=[])


class PrerequisiteExtractBatchResponse(BaseModel):
    model_config = {"populate_by_name": True}

    trees: list[PrerequisiteExtractResponse]


PrerequisiteNodeResponse.model_rebuild()
