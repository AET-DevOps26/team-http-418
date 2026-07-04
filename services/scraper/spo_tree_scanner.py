"""
TUMonline SPO Tree Scanner

Scrapes study program curriculum trees from TUMonline to extract:
- Program name, degree type, total ECTS
- Category/area breakdown with ECTS requirements
- Course IDs per category (via REST API filtered by curriculum node)

Three-pass approach per program:
  1. Collapsed tree (pFilterType=1): get category names, node IDs, ECTS
  2. Expanded tree (pFilterType=20): get ECTS values for categories missing them
  3. REST API per category: get course IDs belonging to each area

Usage:
    python spo_tree_scanner.py --ids 4997,5217,5371
    python spo_tree_scanner.py --ids 4997 --json
    python spo_tree_scanner.py  # scan default CIT programs
"""

import argparse
import base64
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BASE_URL = "https://campus.tum.de/tumonline/wbstpcs.showSpoTree"
COURSES_API = "https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses"


class SpoTreeParser(HTMLParser):
    """Parses TUMonline SPO tree HTML into a flat list of rows with depth info."""

    def __init__(self):
        super().__init__()
        self.rows: list[dict] = []
        self.program_title: str = ""
        self.in_row = False
        self.in_td = False
        self.td_idx = 0
        self.current_row: dict = {}
        self.current_text = ""
        self.found_title = False
        self.in_title_span = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "span" and attrs_dict.get("class", "") == "s" and not self.found_title:
            self.in_title_span = True
            self.current_text = ""

        if tag == "tr" and "class" in attrs_dict and "coRow" in attrs_dict["class"]:
            cls = attrs_dict["class"]
            if "invisible" in cls:
                return
            self.in_row = True
            self.td_idx = 0
            kn_ids = re.findall(r"kn\d+", cls)
            row_id = attrs_dict.get("id", "")
            self.current_row = {"id": row_id, "depth": len(kn_ids)}

        if self.in_row and tag == "td":
            self.in_td = True
            self.current_text = ""

    def handle_data(self, data):
        if self.in_title_span:
            self.current_text += data
        if self.in_row and self.in_td:
            self.current_text += data.strip() + " "

    def handle_endtag(self, tag):
        if tag == "span" and self.in_title_span:
            self.in_title_span = False
            self.program_title = self.current_text.strip()
            self.found_title = True
            self.current_text = ""

        if tag == "td" and self.in_row:
            self.in_td = False
            text = self.current_text.strip()
            if self.td_idx == 0:
                self.current_row["name"] = text
            elif self.td_idx == 2:
                self.current_row["semester"] = text
            elif self.td_idx == 3:
                self.current_row["ects"] = text
            self.td_idx += 1
            self.current_text = ""

        if tag == "tr" and self.in_row:
            self.in_row = False
            if self.current_row.get("name"):
                self.rows.append(self.current_row)


def fetch_html(stp_id: int, filter_type: int = 20) -> str | None:
    url = f"{BASE_URL}?pStpStpNr={stp_id}&pFilterType={filter_type}"
    req = Request(url, headers={"Accept-Language": "en"})
    try:
        with urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except (HTTPError, URLError) as e:
        print(f"  SKIP {stp_id}: {e}", file=sys.stderr)
        return None


def make_filter_resource_id(stp_id: int, node_id: int) -> str:
    raw = f"ELEMENT;VERSION_ID:{stp_id};NODE_ID:{node_id}"
    return base64.b64encode(raw.encode()).decode()


def fetch_category_course_ids(stp_id: int, node_id: int) -> list[int]:
    """Fetch all course IDs for a category node via REST API."""
    filter_id = make_filter_resource_id(stp_id, node_id)
    step = 50
    offset = 0
    all_ids = []

    # first request to get total count
    url = f"{COURSES_API}?$filter=courseFilterResourceId-eq={filter_id}&$skip={offset}&$top={step}"
    req = Request(url, headers={"accept": "application/xml"})
    try:
        with urlopen(req, timeout=30) as resp:
            xml_text = resp.read().decode("utf-8", errors="replace")
            xml_text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", xml_text)
    except (HTTPError, URLError):
        return []

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []

    total_el = root.find("totalCount")
    total = int(total_el.text) if total_el is not None and total_el.text else 0

    # extract course IDs from first page
    for course in root.findall("courses"):
        cid = course.find("id")
        if cid is not None and cid.text:
            all_ids.append(int(cid.text))

    # fetch remaining pages
    offset += step
    while offset < total:
        time.sleep(0.1)
        url = f"{COURSES_API}?$filter=courseFilterResourceId-eq={filter_id}&$skip={offset}&$top={step}"
        req = Request(url, headers={"accept": "application/xml"})
        try:
            with urlopen(req, timeout=30) as resp:
                xml_text = resp.read().decode("utf-8", errors="replace")
                xml_text = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", " ", xml_text)
            page_root = ET.fromstring(xml_text)
            for course in page_root.findall("courses"):
                cid = course.find("id")
                if cid is not None and cid.text:
                    all_ids.append(int(cid.text))
        except (HTTPError, URLError, ET.ParseError):
            break
        offset += step

    return all_ids


def parse_title(title: str) -> dict:
    degree_map = {
        "Masterstudium": "Master",
        "Bachelorstudium": "Bachelor",
        "Aufbaustudium": "Aufbau",
        "Promotionsstudium": "Promotion",
        "Erweiterungsstudium": "Extension",
    }
    degree = "unknown"
    for key, val in degree_map.items():
        if key in title:
            degree = val
            break

    version_match = re.search(r"\((\d{5})", title)
    version = version_match.group(1) if version_match else ""

    status = "active" if "laufend" in title or "current" in title else (
        "ending" if "auslaufend" in title else "unknown"
    )

    name = re.sub(r"\s*\(.*", "", title).strip()
    name = re.sub(r"^\d[\d\s]+", "", name).strip()

    return {"name": name, "degree": degree, "version": version, "status": status}


def scrape_program(stp_id: int, fetch_courses: bool = True) -> dict | None:
    """
    Three-pass scrape:
    1. Collapsed tree for category structure
    2. Expanded tree for ECTS values
    3. REST API per category for course IDs
    """

    # Pass 1: collapsed tree — get category names + node IDs
    collapsed_html = fetch_html(stp_id, filter_type=1)
    if not collapsed_html:
        return None

    collapsed = SpoTreeParser()
    collapsed.feed(collapsed_html)

    if not collapsed.rows:
        return None

    title_info = parse_title(collapsed.program_title)
    root = collapsed.rows[0]

    if not title_info["name"]:
        title_info["name"] = re.sub(r"^\[\d+\]\s*", "", root.get("name", "")).strip()
    if not title_info["version"]:
        vm = re.search(r"\[(\d{5})\]", root.get("name", ""))
        title_info["version"] = vm.group(1) if vm else ""

    # Extract category nodes from collapsed tree
    categories_raw = []
    for row in collapsed.rows[1:]:
        if row["depth"] == 1:
            node_id_str = row["id"].replace("kn", "") if row["id"] else ""
            categories_raw.append({
                "node_id": int(node_id_str) if node_id_str.isdigit() else None,
                "kn_id": row["id"],
                "name": row["name"],
                "ects": row.get("ects", ""),
            })

    # Pass 2: expanded tree — fill in category ECTS + build course ECTS map
    time.sleep(0.3)
    expanded_html = fetch_html(stp_id, filter_type=20)
    # Map: course_id (from expanded tree row name) -> ECTS
    # The expanded tree shows courses with ECTS but we need to map them by
    # finding which category they belong to (by tree parentage)
    course_ects_by_category = {}  # kn_id -> {course_title_fragment -> ects}
    if expanded_html:
        expanded = SpoTreeParser()
        expanded.feed(expanded_html)

        expanded_by_id = {}
        for row in expanded.rows:
            if row.get("id"):
                expanded_by_id[row["id"]] = row

        for cat in categories_raw:
            if not cat["ects"] and cat["kn_id"] in expanded_by_id:
                cat["ects"] = expanded_by_id[cat["kn_id"]].get("ects", "")

            # Collect ECTS for courses under this category in the expanded tree
            collecting = False
            cat_depth = None
            cat_courses_ects = {}
            for row in expanded.rows:
                if row.get("id") == cat["kn_id"]:
                    collecting = True
                    cat_depth = row["depth"]
                    continue
                if collecting:
                    if row["depth"] <= cat_depth:
                        break
                    row_ects = row.get("ects", "")
                    if row_ects and row_ects.isdigit():
                        cat_courses_ects[row.get("name", "")] = int(row_ects)
            course_ects_by_category[cat["kn_id"]] = cat_courses_ects

    # Pass 3: fetch course IDs per category via REST API, merge with ECTS from tree
    categories = []
    for cat in categories_raw:
        ects_raw = cat.get("ects", "")
        ects = int(ects_raw) if isinstance(ects_raw, str) and ects_raw.isdigit() else (
            ects_raw if isinstance(ects_raw, int) else None
        )

        courses = []
        if fetch_courses and cat["node_id"]:
            time.sleep(0.2)
            course_ids = fetch_category_course_ids(stp_id, cat["node_id"])

            # Try to match course IDs to ECTS from the expanded tree
            # The tree has course names, REST API has IDs — we use the category-level
            # ECTS as default (most courses in a category share the same ECTS)
            tree_ects_values = list(course_ects_by_category.get(cat["kn_id"], {}).values())
            # If all courses in the tree have the same ECTS, use that as default
            default_ects = None
            if tree_ects_values:
                unique_ects = set(tree_ects_values)
                if len(unique_ects) == 1:
                    default_ects = unique_ects.pop()

            courses = [{"course_id": cid, "ects": default_ects} for cid in course_ids]
            ects_info = f" @{default_ects}ec" if default_ects else ""
            print(f"    {cat['name'][:45]:<45} {str(ects) + ' ECTS':>8}  {len(course_ids)} courses{ects_info}", file=sys.stderr)

        categories.append({
            "name": cat["name"],
            "ects": ects,
            "node_id": cat["node_id"],
            "courses": courses,
        })

    total_ects = root.get("ects", "")
    if not total_ects and expanded_html:
        total_ects = expanded.rows[0].get("ects", "") if expanded.rows else ""

    return {
        "stp_id": stp_id,
        "title": collapsed.program_title,
        "name": title_info["name"],
        "degree": title_info["degree"],
        "version": title_info["version"],
        "status": title_info["status"],
        "total_ects": int(total_ects) if isinstance(total_ects, str) and total_ects.isdigit() else total_ects,
        "categories": categories,
    }


def scan_programs(ids: list[int], delay: float = 0.5, fetch_courses: bool = True) -> list[dict]:
    results = []
    for i, stp_id in enumerate(ids):
        if i > 0:
            time.sleep(delay)
        print(f"[{i+1}/{len(ids)}] Scraping pStpStpNr={stp_id}...", file=sys.stderr)
        program = scrape_program(stp_id, fetch_courses=fetch_courses)
        if program is None:
            print(f"  {stp_id}: failed", file=sys.stderr)
            continue

        n_cats = len(program["categories"])
        n_courses = sum(len(c["courses"]) for c in program["categories"])
        print(
            f"  {stp_id}: {program['degree']} {program['name']} — "
            f"{program['total_ects']} ECTS, {n_cats} categories, {n_courses} courses",
            file=sys.stderr,
        )
        results.append(program)
    return results


def print_summary(results: list[dict]):
    print(f"\n{'=' * 100}")
    print(f"{'ID':>6}  {'Degree':<10} {'ECTS':>4}  {'Cats':>4}  {'Courses':>7}  Name")
    print("-" * 100)
    for p in sorted(results, key=lambda x: (x["name"], x["degree"])):
        n_courses = sum(len(c["courses"]) for c in p["categories"])
        print(
            f"{p['stp_id']:>6}  {p['degree']:<10} {p['total_ects']:>4}  "
            f"{len(p['categories']):>4}  {n_courses:>7}  {p['name']}"
        )

    for p in sorted(results, key=lambda x: (x["name"], x["degree"])):
        if not p["categories"]:
            continue
        print(f"\n{'=' * 90}")
        print(f"  {p['degree']} {p['name']} (ID: {p['stp_id']}, v{p['version']})")
        print(f"  Total: {p['total_ects']} ECTS")
        print(f"  {'-' * 86}")
        for cat in p["categories"]:
            ects_str = f"({cat['ects']} ECTS)" if cat["ects"] else ""
            n = len(cat['courses'])
            ects_vals = set(c['ects'] for c in cat['courses'] if c.get('ects'))
            per = f" @{ects_vals.pop()}ec" if len(ects_vals) == 1 else ""
            print(f"    {cat['name'][:55]:<55} {ects_str:>12}  [{n} courses{per}]")


def main():
    parser = argparse.ArgumentParser(description="Scan TUMonline SPO trees")
    parser.add_argument("--ids", help="Comma-separated pStpStpNr IDs")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--delay", type=float, default=0.3, help="Request delay (seconds)")
    parser.add_argument("--no-courses", action="store_true", help="Skip fetching course IDs per category")
    args = parser.parse_args()

    if args.ids:
        ids = [int(x.strip()) for x in args.ids.split(",")]
    else:
        ids = [5371, 5217, 5028, 5000, 4999, 4997]

    results = scan_programs(ids, delay=args.delay, fetch_courses=not args.no_courses)

    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print_summary(results)


if __name__ == "__main__":
    main()
