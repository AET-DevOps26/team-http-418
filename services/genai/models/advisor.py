from enum import StrEnum

from pydantic import BaseModel, Field


class MessageRole(StrEnum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class StudentAdvisorProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program: str | None = Field(default=None, alias="studyProgram")
    study_program_id: str | None = Field(default=None, alias="studyProgramId")
    semester: int
    career_goals: list[str] = Field(default=[], alias="careerGoals")
    interests: list[str] = Field(default=[], alias="interests")
    total_credits_earned: int = Field(default=0, alias="totalCreditsEarned")
    total_credits_required: int = Field(default=0, alias="totalCreditsRequired")


class CompletedCourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int


class ConversationMessage(BaseModel):
    role: MessageRole
    content: str


class ReferencedCourse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")


class AdvisorResponse(BaseModel):
    model_config = {"populate_by_name": True}

    content: str
    referenced_courses: list[ReferencedCourse] = Field(default=[], alias="referencedCourses")


class AdvisorRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentAdvisorProfile
    completed_courses: list[CompletedCourseRef] = Field(default=[], alias="completedCourses")
    conversation_history: list[ConversationMessage] = Field(default=[], alias="conversationHistory")
    new_message: str = Field(alias="newMessage")


class AdvisorPromptSuggestionsRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentAdvisorProfile
    completed_courses: list[CompletedCourseRef] = Field(default=[], alias="completedCourses")
    current_semester: str | None = Field(default=None, alias="currentSemester")


class PromptSuggestionChip(BaseModel):
    text: str
    category: str
