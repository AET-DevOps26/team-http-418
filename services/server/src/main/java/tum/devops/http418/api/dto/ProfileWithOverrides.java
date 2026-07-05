package tum.devops.http418.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
	private final List<String> enrolledCourses;
	@JsonProperty("current_semester_key") private final String semesterKey;
	private final String category;
	int limit;
	public ProfileWithOverrides(Profile profile, PostRecommendationsBody prompt) {
		student = profile.student();
		completedCourses = profile.completedCourses();
		availableCourses = profile.availableCourses();
		enrolledCourses = profile.enrolledCourses();
		semesterKey = profile.semesterKey();
		limit = profile.limit();
		category = profile.category();
		overrideGoals = prompt.goals();
		overrideInterests = prompt.interests();
		excludeCourseIds = prompt.excludeCourseIds();
	}
}
