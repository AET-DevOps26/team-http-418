package tum.devops.http418.api.dto;

import java.math.BigDecimal;

public record AddCompletedCourseRequest(long courseId, BigDecimal grade, int credits, String semester,
		String category) {
}
