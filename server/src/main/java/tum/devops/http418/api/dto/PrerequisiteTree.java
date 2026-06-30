package tum.devops.http418.api.dto;

public record PrerequisiteTree(long courseId, String courseName, String previousKnowledgeEn,
		String previousKnowledgeGer) {
}
