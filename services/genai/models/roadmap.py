from pydantic import BaseModel, Field


class StudentRoadmapProfile(BaseModel):
    model_config = {"populate_by_name": True}

    study_program: str | None = Field(default=None, alias="studyProgram")
    study_program_id: str | None = Field(default=None, alias="studyProgramId")
    semester: int
    career_goals: list[str] = Field(default=[], alias="careerGoals")
    interests: list[str] = Field(default=[], alias="interests")
    preferences: "RoadmapPreferences | None" = None


class RoadmapPreferences(BaseModel):
    model_config = {"populate_by_name": True}

    max_credits_per_semester: int = Field(default=30, alias="maxCreditsPerSemester")
    preferred_language: str | None = Field(default=None, alias="preferredLanguage")


class CourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    credits: int
    category: str | None = None
    semester: str | None = None


class AvailableCourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int
    preferred_semester: str | None = Field(default=None, alias="preferredSemester")
    has_prerequisites: bool = Field(default=False, alias="hasPrerequisites")


class CategoryRequirement(BaseModel):
    model_config = {"populate_by_name": True}

    name: str
    credits_required: int = Field(alias="creditsRequired")
    credits_earned: int = Field(alias="creditsEarned")


class DegreeRequirements(BaseModel):
    model_config = {"populate_by_name": True}

    total_credits_required: int = Field(alias="totalCreditsRequired")
    total_credits_earned: int = Field(alias="totalCreditsEarned")
    remaining_semesters: int = Field(alias="remainingSemesters")
    categories: list[CategoryRequirement] = Field(default=[])


class RoadmapRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentRoadmapProfile
    completed_courses: list[CourseRef] = Field(default=[], alias="completedCourses")
    enrolled_courses: list[CourseRef] = Field(default=[], alias="enrolledCourses")
    degree_requirements: DegreeRequirements = Field(alias="degreeRequirements")
    available_courses: list[AvailableCourseRef] = Field(alias="availableCourses")


StudentRoadmapProfile.model_rebuild()
