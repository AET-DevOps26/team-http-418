package tum.devops.http418.api.dto;

import java.math.BigDecimal;

public record CompletedCourseDTO(long courseId, String courseCode, String courseName, BigDecimal grade, int credits,
		String semester, String category) {
}
