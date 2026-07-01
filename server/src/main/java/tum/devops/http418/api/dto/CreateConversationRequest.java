package tum.devops.http418.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateConversationRequest(@NotBlank @Size(max = 255) String title) {
    public CreateConversationRequest() {
        this("New Conversation");
    }
}
