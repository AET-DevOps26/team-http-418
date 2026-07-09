from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, Field


class MessageRole(StrEnum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class StudentAdvisorProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program_id: Annotated[str, Field(default="invalid study id", alias="studyProgramId")]
    study_program: Annotated[str, Field(default="no study field", alias="studyProgramName")]
    semester: int
    career_goals: Annotated[list[str], Field(default=[], alias="careerGoals")]
    interests: Annotated[list[str], Field(default=[], alias="interests")]
    total_credits_earned: Annotated[int, Field(default=0, alias="totalCreditsEarned")]
    total_credits_required: Annotated[int, Field(default=0, alias="totalCreditsRequired")]


class CompletedCourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_code: Annotated[str, Field(alias="courseCode")]
    course_name: Annotated[str, Field(alias="courseName")]
    credits: int


class ConversationMessage(BaseModel):
    role: MessageRole
    content: str


class ReferencedCourse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: Annotated[int, Field(alias="courseId")]
    course_code: Annotated[str, Field(alias="courseCode")]


class AdvisorResponse(BaseModel):
    model_config = {"populate_by_name": True}

    content: str
    referenced_courses: Annotated[list[ReferencedCourse], Field(default=[], alias="referencedCourses")]


class AdvisorRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentAdvisorProfile
    completed_courses: Annotated[list[CompletedCourseRef], Field(default=[], alias="completedCourses")]

    conversation_history: Annotated[list[ConversationMessage], Field(default=[], alias="conversationHistory")]

    new_message: Annotated[str, Field(alias="newMessage")]


class AdvisorPromptSuggestionsRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentAdvisorProfile

    completed_courses: Annotated[list[CompletedCourseRef], Field(default=[], alias="completedCourses")]

    current_semester: Annotated[str | None, Field(default=None, alias="currentSemester")]


class PromptSuggestionChip(BaseModel):
    text: str
    category: str
