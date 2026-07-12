package tum.devops.http418.api.dto;


import java.util.List;

public record Profile(Student student, List<String> completedCourses, List<String> enrolledCourses,
		List<String> availableCourses, Integer limit, String category, String semesterKey) {

	public record Student(String firstName, String lastName,
						  String studyProgramId, String studyProgramName, int semester, List<String> careerGoals, List<String> interests,
						  int preferredWorkload, int creditsEarned, int creditsRequired,
						  String expectedGraduation, String industryPreference,
						  String rolePreference, boolean onboardingCompleted) {

        public Student(){
            this("", "", "invalid id", "no study program",1, List.of(), List.of(), 0, 0, 0, null, null, null, null, false);
        }
	}

	public Profile() { // default
		this(new Student(), List.of(), List.of(), List.of(), 10, "all", "26S");
	}
}
