package tum.devops.http418.api.dto;

import java.math.BigDecimal;

public record AddCompletedCourseRequest(long courseId, BigDecimal grade, Integer credits, String semester,
		String category) {
	public String semesterOrNull() {
		return semester != null && !semester.isBlank() ? semester : null;
	}
}
