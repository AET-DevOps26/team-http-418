package tum.devops.http418.api.dto;

import java.util.List;

public record Profile(Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, Integer limit, String category, String semesterKey) {

	public record WorkExperience(String company, String role, String duration, String description) {
	}

	public record Education(String institution, String degree, String field, String years) {
	}

	public record CvData(List<WorkExperience> workExperience, List<String> skills,
			List<String> languages, List<Education> education) {
	}

	public record Student(String studyProgramId, int semester, List<String> careerGoals, List<String> interests,
			int preferredWorkload, int creditsEarned, int creditsRequired,
			String expectedGraduation, String industryPreference,
			String rolePreference, CvData cvData, boolean onboardingCompleted) {
	}

	public Profile() { // default
		this(new Student("no study program", 1, List.of(), List.of(), 0, 0, 0, null, null, null, null, false),
				List.of(), List.of(), List.of(), 10, "all", "26S");
	}
}
