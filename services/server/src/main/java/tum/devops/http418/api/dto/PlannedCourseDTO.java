package tum.devops.http418.api.dto;

public record PlannedCourseDTO(long courseId, String courseCode, String courseName, int credits, String status) {
}
