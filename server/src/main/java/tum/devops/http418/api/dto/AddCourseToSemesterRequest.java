package tum.devops.http418.api.dto;

public record AddCourseToSemesterRequest(long courseId, String courseName, int credits) {
}
