from pydantic import BaseModel, ConfigDict, Field


class WorkExperience(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""


class Education(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    years: str = ""


class CvParseResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    work_experience: list[WorkExperience] = Field(default=[], alias="workExperience")
    skills: list[str] = []
    languages: list[str] = []
    education: list[Education] = []
