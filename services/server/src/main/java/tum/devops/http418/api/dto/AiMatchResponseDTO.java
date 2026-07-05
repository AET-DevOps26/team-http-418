package tum.devops.http418.api.dto;

import java.util.List;

public record AiMatchResponseDTO(List<Match> matches, List<String> unmatched) {
	public record Match(String moduleId, String courseId, String courseCode, String courseName, double score) {}
}
