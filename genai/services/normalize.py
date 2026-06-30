def normalize_prerequisite_nodes(items: list, available_map: dict) -> list:
    result = []
    for item in items:
        if not isinstance(item, dict):
            continue
        course_id = item.get("courseId")
        if course_id not in available_map:
            continue
        course = available_map[course_id]
        type_val = item.get("type", "RECOMMENDED")
        if type_val not in ("REQUIRED", "RECOMMENDED"):
            type_val = "RECOMMENDED"
        nested = normalize_prerequisite_nodes(item.get("prerequisites", []), available_map)
        result.append({
            "courseId": course_id,
            "courseCode": str(course_id),
            "courseName": course.course_name,
            "type": type_val,
            "prerequisites": nested,
        })
    return result
