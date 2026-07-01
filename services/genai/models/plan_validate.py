from typing import Literal

from pydantic import BaseModel, Field


class TimeSlot(BaseModel):
    model_config = {"populate_by_name": True}

    day: str
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")


class StudentPreferences(BaseModel):
    model_config = {"populate_by_name": True}

    max_credits_per_semester: int = Field(default=30, alias="maxCreditsPerSemester")
    blocked_time_slots: list[TimeSlot] = Field(default=[], alias="blockedTimeSlots")
    prefer_no_back_to_back: bool = Field(default=False, alias="preferNoBackToBack")


class StudentPlanProfile(BaseModel):
    model_config = {"populate_by_name": True}

    semester: int
    career_goals: list[str] = Field(default=[], alias="careerGoals")
    preferences: StudentPreferences = Field(default_factory=StudentPreferences)


class CourseScheduleEntry(BaseModel):
    model_config = {"populate_by_name": True}

    day: str
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    type: str = Field(default="LECTURE")


class SemesterCourse(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")
    credits: int
    schedule: list[CourseScheduleEntry] = Field(default=[])


class SemesterPlanInput(BaseModel):
    model_config = {"populate_by_name": True}

    semester_key: str = Field(alias="semesterKey")
    total_credits: int = Field(alias="totalCredits")
    courses: list[SemesterCourse] = Field(default=[])


class CompletedCourseRef(BaseModel):
    model_config = {"populate_by_name": True}

    course_code: str = Field(alias="courseCode")
    course_name: str = Field(alias="courseName")


class PlanValidateRequest(BaseModel):
    model_config = {"populate_by_name": True}

    student: StudentPlanProfile
    semester_plan: SemesterPlanInput = Field(alias="semesterPlan")
    completed_courses: list[CompletedCourseRef] = Field(default=[], alias="completedCourses")


class Warning(BaseModel):
    type: Literal["WORKLOAD_EXCEEDED", "SCHEDULING_PREFERENCE", "RISKY_COMBINATION"]
    severity: Literal["ERROR", "WARNING", "INFO"]
    message: str


class PlanValidateResponse(BaseModel):
    warnings: list[Warning]
