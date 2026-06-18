import xml.etree.ElementTree as ET
from datetime import date, datetime, time


def find_or(tree: ET.Element | None, key: str, other: ET.Element | None = None) -> ET.Element | None:
    if tree is None:
        return other
    found = tree.find(key)
    return found if found is not None else other


def text_at(tree: ET.Element | None, path: str, default: str | None = None) -> str | None:
    if tree is None:
        return default
    el = tree.find(path)
    if el is None or el.text is None:
        return default
    text = el.text.strip()
    return text if text else default


def int_at(tree: ET.Element | None, path: str, default: int | None = None) -> int | None:
    value = text_at(tree, path)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def lang_text(tree: ET.Element | None, path: str, lang: str, default: str | None = None) -> str | None:
    """
    Reads values like:
      <courseTitle>
        <value>...</value>
        <translations>
          <translation lang="de">...</translation>
          <translation lang="en">...</translation>
        </translations>
      </courseTitle>
    """
    if tree is None:
        return default

    # ElementTree supports this attribute filter syntax.
    translated = text_at(tree, f"{path}/translations/translation[@lang='{lang}']")
    if translated is not None:
        return translated

    return text_at(tree, f"{path}/value", default)


def date_at(tree: ET.Element | None, path: str) -> date | None:
    value = text_at(tree, path)
    if value is None:
        return None
    return date.fromisoformat(value)


def xml_string(el: ET.Element | None) -> str | None:
    if el is None:
        return None
    return ET.tostring(el).decode("utf-8")


def time_from_text(value: str | None) -> time | None:
    if not value:
        return None
    return time.fromisoformat(value)


def time_at(tree: ET.Element | None, path: str) -> time | None:
    value = text_at(tree, path)
    if value is None:
        return None

    # Handles "08:15"
    if len(value) == 5:
        return time.fromisoformat(value)

    # Handles "2026-04-14T08:15:00"
    return datetime.fromisoformat(value).time()


def parse_curriculum_positions(curriculum_positions_xml, course_id: int) -> list[dict]:
    parsed_positions = []

    for resource in curriculum_positions_xml:
        dto = resource.find(".//coCurriculumPositionDto")
        if dto is None:
            continue

        study_name_info = dto.find("studyNameInfoDto")
        curriculum_version_info = dto.find("curriculumVersionInfoDto")
        curriculum_info = curriculum_version_info.find("curriculumInfo")
        curriculum_potition_path = dto.find("curriculumPositionPathDto")

        curriculum_version_id = int_at(study_name_info, "curriculumVersionId") or int_at(curriculum_version_info, "id")

        study_name_ger = lang_text(study_name_info, "name", "de") or lang_text(curriculum_info, "displayedName", "de")

        study_name_en = lang_text(study_name_info, "name", "en") or lang_text(curriculum_info, "displayedName", "en")

        study_identifier = text_at(curriculum_info, "displayedCode") or int_at(study_name_info, "studyIdentifier") or ""

        subject_type = text_at(dto, "subjectTypeDto/value/value", None)
        designation: int = None
        path = []
        if curriculum_potition_path is not None:
            for i, path_el in enumerate(curriculum_potition_path.findall("path")):
                if i == 0:
                    designation = int_at(path_el, "designation")
                element_id = int_at(path_el, "elementId")
                default_name = text_at(path_el, "name/value")

                if element_id is None and default_name is None:
                    continue

                path.append(
                    {
                        "element_id": element_id,
                        "name": default_name,
                    }
                )

        parsed_positions.append(
            {
                "course_id": course_id,
                "curriculum_version_id": curriculum_version_id,
                "study_name_ger": study_name_ger,
                "study_name_en": study_name_en,
                "study_id": study_identifier,
                "designation": designation,
                "subject_type": subject_type,
                "path": path,
                "source_xml": xml_string(resource),
            }
        )

    return parsed_positions
