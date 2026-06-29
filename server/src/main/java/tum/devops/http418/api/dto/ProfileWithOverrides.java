package tum.devops.http418.api.dto;

import java.util.List;

public class ProfileWithOverrides {

	Profile.Student student;
	List<String> overrideGoals;
	List<String> overrideInterests;
	List<String> excludeCourseIds;
	List<String> completedCourses;
	List<String> availableCourses;
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
