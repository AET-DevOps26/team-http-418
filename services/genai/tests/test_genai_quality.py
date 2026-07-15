import json
from pathlib import Path

import pytest
from langchain_core.messages import SystemMessage
from pydantic import ValidationError

from evals.contracts import EvalSuite
from models.advisor import AdvisorRequest
from models.embeddings import CourseItem
from models.recommendations import CourseRef, RecommendationsRequest
from models.roadmap import RoadmapGeneration, RoadmapRequest
from services.advisor import _build_messages as build_advisor_messages
from services.embeddings import _build_text
from services.recommendations import _build_prompt, _build_query, _filter_candidates, _parse_selections
from services.roadmap import _build_messages as build_roadmap_messages


def _request():
    return RecommendationsRequest.model_validate(
        {
            "student": {
                "studyProgramName": "Informatics",
                "studyProgramId": "1",
                "semester": 3,
                "careerGoals": ["cloud engineer"],
                "interests": ["distributed systems"],
                "skills": ["Python"],
            },
            "completedCourses": ["Completed"],
            "enrolledCourses": ["Enrolled"],
            "availableCourses": ["1", "2", "3", "4"],
            "excludeCourseIds": [1],
            "category": "Systems",
        }
    )


def test_filtering_removes_ineligible_courses_before_ranking():
    request = _request()
    candidates = [
        (CourseRef(courseId=1, courseCode="EX", courseName="Excluded", credits=6, category="Systems"), 1),
        (CourseRef(courseId=2, courseCode="CO", courseName="Completed", credits=6, category="Systems"), 1),
        (CourseRef(courseId=3, courseCode="EN", courseName="Enrolled", credits=6, category="Systems"), 1),
        (CourseRef(courseId=4, courseCode="WR", courseName="Wrong", credits=6, category="Data"), 1),
        (CourseRef(courseId=5, courseCode="NA", courseName="Unavailable", credits=6, category="Systems"), 1),
    ]
    assert _filter_candidates(request, candidates) == []


def test_recommendation_query_and_prompt_include_required_context_and_roles():
    request = _request()
    query = _build_query(["goal"], ["interest"], ["skill"], "Informatics", 3)
    assert all(value in query for value in ["goal", "interest", "skill", "Informatics", "semester 3"])
    prompt = _build_prompt(
        request,
        request.student.career_goals,
        request.student.interests,
        [(CourseRef(courseId=4, courseCode="SYS", courseName="Systems", credits=6), 0.9)],
    )
    assert all(value in prompt for value in ["Informatics", "cloud engineer", "Python", "Completed", "Enrolled"])
    assert isinstance(SystemMessage(content=prompt), SystemMessage)


def test_roadmap_prompt_contains_ects_requirements_courses_and_offering_data():
    request = RoadmapRequest.model_validate(
        {
            "student": {
                "studyProgram": "Informatics",
                "semester": 4,
                "careerGoals": ["ML"],
                "interests": ["vision"],
                "preferences": {"maxCreditsPerSemester": 18},
            },
            "completedCourses": [{"courseId": 1, "courseCode": "MA", "courseName": "Math", "credits": 6}],
            "enrolledCourses": [{"courseId": 2, "courseCode": "PR", "courseName": "Programming", "credits": 6}],
            "degreeRequirements": {
                "totalCreditsRequired": 180,
                "totalCreditsEarned": 60,
                "remainingSemesters": 4,
                "categories": [{"name": "AI", "creditsRequired": 24, "creditsEarned": 6}],
            },
            "availableCourses": [
                {
                    "courseId": 3,
                    "courseCode": "CV",
                    "courseName": "Computer Vision",
                    "credits": 6,
                    "category": "AI",
                    "preferredSemester": "W",
                    "hasPrerequisites": True,
                }
            ],
            "currentSemesterKey": "26S",
        }
    )
    content = build_roadmap_messages(request)[0].content
    assert all(
        value in content for value in ["180", "AI: 6/24", "Math", "Computer Vision", "offered: W", "has prerequisites"]
    )


def test_advisor_embedding_and_output_contracts():
    request = AdvisorRequest.model_validate(
        {
            "student": {"studyProgramId": "1", "studyProgramName": "Informatics", "semester": 3},
            "completedCourses": [{"courseCode": "MA", "courseName": "Linear Algebra", "credits": 6}],
            "enrolledCourses": ["Machine Learning"],
            "newMessage": "What next?",
        }
    )
    advisor = build_advisor_messages(request)[0].content
    assert "Linear Algebra (MA, 6 ECTS)" in advisor and "Machine Learning" in advisor
    text = _build_text(
        CourseItem(
            course_id=1,
            title_en="Machine Learning",
            title_ger="Machine Learning",
            description_en="Learn models",
            description_ger="Modelle lernen",
            course_objective_en="Learn models",
            course_objective_ger="Learn models",
            previous_knowledge_en="Linear algebra",
            previous_knowledge_ger="Lineare Algebra",
        )
    )
    assert "Title (DE)" not in text and "Description (DE): Modelle lernen" in text and "Prerequisites:" in text
    with pytest.raises(ValidationError):
        RoadmapGeneration.model_validate({"semesters": "bad"})
    with pytest.raises(ValueError):
        _parse_selections(
            [
                {"courseId": 1, "relevanceScore": 0.5, "reason": "a"},
                {"courseId": 1, "relevanceScore": 0.4, "reason": "b"},
            ],
            {1},
        )


def test_shared_eval_contract_fixture_validates():
    suite = EvalSuite.model_validate(
        json.loads((Path(__file__).parents[1] / "evals/fixtures/cases.v1.json").read_text())
    )
    assert len(suite.cases) == 10
    RoadmapRequest.model_validate(
        json.loads((Path(__file__).parents[1] / "evals/fixtures/roadmap-contract.v1.json").read_text())
    )
