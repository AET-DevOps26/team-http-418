package tum.devops.http418.api.dto;

import java.util.List;

public record DegreeRequirementsDTO(int totalCredits, List<AcademicProgressDTO.CreditsByCategory> creditsByCategory,
		List<CompletedCourseDTO> completedCourses) {
}
