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
