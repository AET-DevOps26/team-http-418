from enum import StrEnum

from pydantic import BaseModel, Field


class MessageRole(StrEnum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class StudentAdvisorProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program: str = Field(alias="studyProgram")
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


class AdvisorRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentAdvisorProfile
    completed_courses: list[CompletedCourseRef] = Field(default=[], alias="completedCourses")
    conversation_history: list[ConversationMessage] = Field(default=[], alias="conversationHistory")
    new_message: str = Field(alias="newMessage")
