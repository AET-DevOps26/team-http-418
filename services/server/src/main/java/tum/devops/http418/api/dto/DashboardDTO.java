package tum.devops.http418.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(DashboardProgress progress, List<EnrolledCourseDTO> upcomingCourses,
		List<String> alerts, List<SimpleCourseData> recommendations) {

	public record DashboardProgress(int totalCredits, BigDecimal gpa, int completedCourses, int enrolledCourses) {
	}
}
