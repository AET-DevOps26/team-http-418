package tum.devops.http418.api.dto;

import jakarta.validation.constraints.Size;

public record CreateConversationRequest(@Size(max = 255) String title) {

    public CreateConversationRequest {
        if (title == null || title.isBlank()) {
            title = "New Conversation";
        }
    }
}
