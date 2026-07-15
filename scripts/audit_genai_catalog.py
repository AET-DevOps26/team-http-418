#!/usr/bin/env python3
"""Stream the committed catalog dump and enforce stable GenAI semantic coverage."""

import argparse
import gzip
import json
import random
from collections import defaultdict
from pathlib import Path


COURSE_COLUMNS = ("id", "semester_id", "course_type_id", "organization_id", "title_ger", "title_en", "identity_code_id", "sws", "description_ger", "description_en", "previous_knowledge_ger", "previous_knowledge_en", "course_objective_ger", "course_objective_en")


def nonempty(value: str) -> bool:
    return bool(value and value != "\\N" and value.strip())


def extract_metrics(dump: Path) -> tuple[dict, list[dict]]:
    count = titles = semantic = duplicates = 0
    courses: list[dict] = []
    reading = False
    with gzip.open(dump, "rt", errors="replace") as stream:
        for line in stream:
            if line.startswith("COPY public.courses "):
                reading = True
                continue
            if not reading:
                continue
            if line == "\\.\n":
                break
            values = line.rstrip("\n").split("\t")
            if len(values) < len(COURSE_COLUMNS):
                continue
            row = dict(zip(COURSE_COLUMNS, values, strict=False))
            count += 1
            titles += nonempty(row["title_en"]) or nonempty(row["title_ger"])
            semantic += any(nonempty(row[k]) for k in ("description_en", "description_ger", "previous_knowledge_en", "previous_knowledge_ger", "course_objective_en", "course_objective_ger"))
            duplicates += any(nonempty(row[a]) and row[a].strip().casefold() == row[b].strip().casefold() for a, b in (("title_en", "title_ger"), ("description_en", "description_ger"), ("previous_knowledge_en", "previous_knowledge_ger"), ("course_objective_en", "course_objective_ger")))
            title = row["title_en"] if nonempty(row["title_en"]) else row["title_ger"]
            courses.append({"id": int(row["id"]), "title": title, "stratum": (title or "?")[:1].upper()})
    if not count:
        raise RuntimeError("courses COPY section was not found")
    return {"courseCount": count, "usableTitleCoverage": titles / count, "semanticContentCoverage": semantic / count, "duplicateEnDeCoverage": duplicates / count}, courses


def sample(courses: list[dict], count: int = 100) -> list[dict]:
    buckets: dict[str, list[dict]] = defaultdict(list)
    for course in courses:
        buckets[course["stratum"]].append(course)
    rng = random.Random(418)
    for values in buckets.values():
        rng.shuffle(values)
    result = []
    while len(result) < count and any(buckets.values()):
        for key in sorted(buckets):
            if buckets[key] and len(result) < count:
                result.append(buckets[key].pop())
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dump", default="infra/db/init/courses-data.sql.gz.data")
    parser.add_argument("--baseline", default="services/genai/evals/catalog-baseline.json")
    parser.add_argument("--sample-output")
    parser.add_argument("--write-baseline", action="store_true")
    args = parser.parse_args()
    current, courses = extract_metrics(Path(args.dump))
    if args.sample_output:
        Path(args.sample_output).write_text(json.dumps({"seed": 418, "courses": sample(courses)}, indent=2) + "\n")
    baseline_path = Path(args.baseline)
    if args.write_baseline:
        baseline_path.write_text(json.dumps(current, indent=2) + "\n")
        return
    baseline = json.loads(baseline_path.read_text())
    failures = []
    if current["courseCount"] < baseline["courseCount"] * .95:
        failures.append("course count fell by more than 5%")
    if current["usableTitleCoverage"] < .99:
        failures.append("usable-title coverage is below 99%")
    if current["semanticContentCoverage"] < baseline["semanticContentCoverage"] - .02:
        failures.append("semantic-content coverage fell by more than 2 percentage points")
    if current["duplicateEnDeCoverage"] > baseline["duplicateEnDeCoverage"] + .02:
        failures.append("duplicate EN/DE coverage worsened by more than 2 percentage points")
    print(json.dumps(current, indent=2))
    if failures:
        raise SystemExit("; ".join(failures))


if __name__ == "__main__":
    main()
