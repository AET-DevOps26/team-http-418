package tum.devops.http418.api.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class ProfileWithOverrides {
	private final Profile.Student student;
	private final List<String> overrideGoals;
	private final List<String> overrideInterests;
	private final List<String> excludeCourseIds;
	private final List<String> completedCourses;
	private final List<String> availableCourses;
	int limit;
	public ProfileWithOverrides(Profile profile, PostRecommendationsBody prompt) {
		student = profile.student();
		overrideGoals = prompt.goals();
		overrideInterests = prompt.interests();
		excludeCourseIds = prompt.excludeCourseIds();
		completedCourses = profile.completedCourses();
		availableCourses = profile.availableCourses();
		limit = profile.limit();
	}
}
