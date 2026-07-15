from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program: str | None = Field(default="no study program", alias="studyProgramName")
    study_program_id: int | None = Field(default="0", alias="studyProgramId")
    semester: int
    career_goals: list[str] = Field(default=[], alias="careerGoals")
    interests: list[str] = Field(default=[], alias="interests")
    preferred_workload: int | None = Field(default=None, alias="preferredWorkload")
    skills: list[str] = Field(default=[])
    industry_preference: str | None = Field(default=None, alias="industryPreference")
    role_preference: str | None = Field(default=None, alias="rolePreference")


class CourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int
    description: str | None = None


class RecommendationItem(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    relevance_score: float = Field(alias="relevanceScore")
    reason: str
    tags: list[str] = Field(default=[])


class RecommendationsResponse(BaseModel):
    model_config = {"populate_by_name": True}

    recommendations: list[RecommendationItem]
    generated_at: str = Field(alias="generatedAt")


class RecommendationsRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentProfile
    completed_courses: list[str] = Field(default=[], alias="completedCourses")
    enrolled_courses: list[str] = Field(default=[], alias="enrolledCourses")
    available_courses: list[str] = Field(default=[], alias="availableCourses")
    limit: int = 10
    override_goals: list[str] | None = Field(default=None, alias="overrideGoals")
    override_interests: list[str] | None = Field(default=None, alias="overrideInterests")
    exclude_course_ids: list[int] | None = Field(default=None, alias="excludeCourseIds")
    category: str | None = None
    current_semester_key: str | None = None
