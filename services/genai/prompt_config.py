import re
from dataclasses import dataclass, field
from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent / "prompts"

_PLACEHOLDER_RE = re.compile(r"(?<!\{)\{(\w+)\}(?!\})")


@dataclass
class PromptSpec:
    template_file: str
    placeholders: list[str]
    description: str = ""
    _template_text: str = field(init=False, repr=False)

    def __post_init__(self):
        self._template_text = (_PROMPTS_DIR / self.template_file).read_text()

    def render(self, **kwargs) -> str:
        return self._template_text.format(**kwargs)


PROMPT_SPECS: dict[str, PromptSpec] = {
    "advisor": PromptSpec(
        template_file="advisor.txt",
        placeholders=[
            "study_program", "semester", "career_goals", "interests",
            "credits_earned", "credits_required", "completed_courses", "enrolled_courses",
        ],
        description="System prompt for the two-step advisor chat (query + answer)",
    ),
    "advisor_rag_has_data": PromptSpec(
        template_file="advisor_rag_has_data.txt",
        placeholders=["courses_text"],
        description="RAG context injected when semantic search returns results",
    ),
    "advisor_rag_no_data": PromptSpec(
        template_file="advisor_rag_no_data.txt",
        placeholders=[],
        description="RAG context injected when semantic search returns nothing",
    ),
    "suggestions": PromptSpec(
        template_file="suggestions.txt",
        placeholders=[
            "study_program", "semester", "current_semester", "career_goals",
            "interests", "credits_earned", "credits_required", "completed_courses",
        ],
        description="Generate personalized prompt chips for the advisor chat",
    ),
    "plan_validate": PromptSpec(
        template_file="plan_validate.txt",
        placeholders=[
            "semester", "career_goals", "max_credits_per_semester",
            "prefer_no_back_to_back", "blocked_time_slots",
            "semester_key", "total_credits", "courses_text", "completed_courses",
        ],
        description="Validate a semester plan for soft conflicts",
    ),
    "prerequisites": PromptSpec(
        template_file="prerequisites.txt",
        placeholders=["course_name", "previous_knowledge_text", "available_courses_text"],
        description="Extract structured prerequisite relationships for a single course",
    ),
    "prerequisites_batch": PromptSpec(
        template_file="prerequisites_batch.txt",
        placeholders=["target_ids", "prompts"],
        description="Batch wrapper that groups multiple prerequisite extractions",
    ),
    "recommendations": PromptSpec(
        template_file="recommendations.txt",
        placeholders=[
            "limit", "study_program", "semester", "current_semester_key",
            "goals", "interests", "skills", "completed_names", "enrolled_names",
            "courses_text", "career_context",
        ],
        description="Select best courses from pre-ranked candidates",
    ),
    "recommendations_user": PromptSpec(
        template_file="recommendations_user.txt",
        placeholders=[],
        description="User message triggering the recommendations selection",
    ),
    "roadmap": PromptSpec(
        template_file="roadmap.txt",
        placeholders=[
            "study_program", "current_semester", "career_goals", "interests",
            "max_credits_per_semester", "credits_earned", "credits_required",
            "remaining_semesters", "categories_text", "completed_courses_text",
            "enrolled_courses_text", "available_courses_text",
        ],
        description="Generate a semester-by-semester degree completion plan",
    ),
    "roadmap_user": PromptSpec(
        template_file="roadmap_user.txt",
        placeholders=[],
        description="User message triggering roadmap generation",
    ),
}


def get_spec(name: str) -> PromptSpec:
    return PROMPT_SPECS[name]


def validate_all_specs():
    errors = []
    for name, spec in PROMPT_SPECS.items():
        found = set(_PLACEHOLDER_RE.findall(spec._template_text))
        declared = set(spec.placeholders)
        missing_declared = found - declared
        extra_declared = declared - found
        if missing_declared:
            errors.append(f"{name}: template has undeclared placeholders {missing_declared}")
        if extra_declared:
            errors.append(f"{name}: declares unused placeholders {extra_declared}")
    if errors:
        raise ValueError("Prompt spec validation failed:\n" + "\n".join(errors))
