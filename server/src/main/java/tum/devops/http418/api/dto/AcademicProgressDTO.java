package tum.devops.http418.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record AcademicProgressDTO(int totalCredits, BigDecimal gpa, int completedCourses, int enrolledCourses,
		List<CreditsByCategory> creditsByCategory) {

	public record CreditsByCategory(String category, int credits) {
	}
}
