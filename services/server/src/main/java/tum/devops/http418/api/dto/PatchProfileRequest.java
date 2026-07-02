package tum.devops.http418.api.dto;

import java.util.List;

public record PatchProfileRequest(
		String studyProgramId,
		Integer semester,
		List<String> careerGoals,
		List<String> interests,
		Integer preferredWorkload,
		String expectedGraduation,
		String industryPreference,
		String rolePreference,
		Boolean onboardingCompleted) {
}
