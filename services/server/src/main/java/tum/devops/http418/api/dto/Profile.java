package tum.devops.http418.api.dto;

import java.util.List;

public record Profile(Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, int limit, String category, String semesterKey) {

	public record Student(String studyProgram, int semester, String[] careerGoals, String[] interests,
			int preferredWorkload) {
	}
}
