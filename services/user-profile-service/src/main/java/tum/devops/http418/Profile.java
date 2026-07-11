package tum.devops.http418;

import jakarta.annotation.Nonnull;

import java.util.List;

public record Profile(@Nonnull Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, int limit, String category, String semesterKey) {

	public record Student(String firstName, String lastName,
			String studyProgramId, int semester, List<String> careerGoals, List<String> interests,
			int preferredWorkload, int creditsEarned, int creditsRequired,
			String expectedGraduation, String industryPreference,
			String rolePreference, boolean onboardingCompleted) {
	}
}
