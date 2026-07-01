package tum.devops.http418.api.dto;

import java.util.List;

public record ConversationDTO(String id, String title, String createdAt, String updatedAt,
		List<ConversationMessageDTO> messages) {
}
