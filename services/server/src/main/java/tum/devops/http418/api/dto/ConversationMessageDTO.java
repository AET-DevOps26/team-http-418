package tum.devops.http418.api.dto;

import java.util.List;

public record ConversationMessageDTO(String id, String role, String content, List<SimpleCourseData> referencedCourses,
		String createdAt) {
}
