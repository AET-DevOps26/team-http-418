package tum.devops.http418;

import java.util.List;

public record Profile(Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, int limit, String category, String semesterKey) {

	record Student(String studyProgram, int semester, List<String> careerGoals, List<String> interests,
			int preferredWorkload) {
	}
}
