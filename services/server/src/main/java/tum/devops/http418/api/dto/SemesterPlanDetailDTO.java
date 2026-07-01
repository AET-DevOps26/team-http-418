package tum.devops.http418.api.dto;

import java.util.List;

public record SemesterPlanDetailDTO(String semesterKey, String label, int totalCredits,
		List<PlannedCourseDTO> courses, boolean isCurrent) {
}
