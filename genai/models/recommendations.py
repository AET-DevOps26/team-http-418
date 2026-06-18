from pydantic import BaseModel, Field


class StudentProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program: str = Field(alias="studyProgram")
    semester: int
    career_goals: list[str] = Field(default=[], alias="careerGoals")
    interests: list[str] = Field(default=[], alias="interests")
    preferred_workload: int | None = Field(default=None, alias="preferredWorkload")


class CourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int
    description: str | None = None


class RecommendationsRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentProfile
    completed_courses: list[CourseRef] = Field(default=[], alias="completedCourses")
    enrolled_courses: list[CourseRef] = Field(default=[], alias="enrolledCourses")
    available_courses: list[CourseRef] = Field(alias="availableCourses")
    limit: int = 10
    override_goals: list[str] | None = Field(default=None, alias="overrideGoals")
    override_interests: list[str] | None = Field(default=None, alias="overrideInterests")
    exclude_course_ids: list[int] | None = Field(default=None, alias="excludeCourseIds")
    category: str | None = None
    semester: str | None = None
