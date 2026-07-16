package tum.devops.http418.api.dto;

import java.math.BigDecimal;

public record CompletedCourseDTO(Long courseId, String courseCode, String courseName, BigDecimal grade, int credits,
		String semester, String category) {
}
