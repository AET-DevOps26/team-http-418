package tum.devops.http418.api.dto;

public record ConversationMessageDTO(String id, String role, String content, String referencedCourses,
		String createdAt) {
}
