package tum.devops.http418;

import jakarta.annotation.Nonnull;

import java.util.List;

public record Profile(@Nonnull Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, int limit, String category, String semesterKey) {

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
}
