import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.normalize import normalize_prerequisite_nodes


class _Course:
    def __init__(self, course_id, course_name):
        self.course_id = course_id
        self.course_name = course_name


def _catalog(*ids):
    return {i: _Course(i, f"Course {i}") for i in ids}


def test_empty_list_returns_empty():
    assert normalize_prerequisite_nodes([], _catalog(1, 2)) == []


def test_valid_top_level_node_returned():
    raw = [{"courseId": 1, "type": "REQUIRED", "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert len(result) == 1
    assert result[0]["courseId"] == 1
    assert result[0]["type"] == "REQUIRED"
    assert result[0]["prerequisites"] == []


def test_unknown_course_id_dropped():
    raw = [{"courseId": 999, "type": "REQUIRED", "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert result == []


def test_invalid_type_defaults_to_recommended():
    raw = [{"courseId": 1, "type": "MANDATORY", "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert result[0]["type"] == "RECOMMENDED"


def test_missing_type_defaults_to_recommended():
    raw = [{"courseId": 1, "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert result[0]["type"] == "RECOMMENDED"


def test_nested_valid_prerequisites_preserved():
    raw = [
        {
            "courseId": 1,
            "type": "REQUIRED",
            "prerequisites": [
                {"courseId": 2, "type": "RECOMMENDED", "prerequisites": []}
            ],
        }
    ]
    result = normalize_prerequisite_nodes(raw, _catalog(1, 2))
    assert len(result) == 1
    assert len(result[0]["prerequisites"]) == 1
    assert result[0]["prerequisites"][0]["courseId"] == 2


def test_nested_unknown_course_id_dropped():
    raw = [
        {
            "courseId": 1,
            "type": "REQUIRED",
            "prerequisites": [
                {"courseId": 999, "type": "RECOMMENDED", "prerequisites": []}
            ],
        }
    ]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert result[0]["prerequisites"] == []


def test_deeply_nested_preserved():
    raw = [
        {
            "courseId": 1,
            "type": "REQUIRED",
            "prerequisites": [
                {
                    "courseId": 2,
                    "type": "RECOMMENDED",
                    "prerequisites": [
                        {"courseId": 3, "type": "REQUIRED", "prerequisites": []}
                    ],
                }
            ],
        }
    ]
    result = normalize_prerequisite_nodes(raw, _catalog(1, 2, 3))
    assert result[0]["prerequisites"][0]["prerequisites"][0]["courseId"] == 3


def test_non_dict_items_skipped():
    raw = ["not-a-dict", 42, None, {"courseId": 1, "type": "REQUIRED", "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    assert len(result) == 1
    assert result[0]["courseId"] == 1


def test_all_fields_present_in_output():
    raw = [{"courseId": 1, "type": "REQUIRED", "prerequisites": []}]
    result = normalize_prerequisite_nodes(raw, _catalog(1))
    node = result[0]
    assert node["courseId"] == 1
    assert node["courseCode"] == "1"
    assert node["courseName"] == "Course 1"
    assert node["type"] == "REQUIRED"
    assert node["prerequisites"] == []
