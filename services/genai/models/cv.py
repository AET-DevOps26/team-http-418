from pydantic import BaseModel


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
    workExperience: list[WorkExperience] = []
    skills: list[str] = []
    languages: list[str] = []
    education: list[Education] = []
