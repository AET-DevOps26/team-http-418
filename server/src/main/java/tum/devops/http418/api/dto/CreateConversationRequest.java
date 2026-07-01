package tum.devops.http418.api.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateConversationRequest(@JsonSetter(nulls = Nulls.SKIP) @NotBlank @Size(max = 255) String title) {
    public CreateConversationRequest() {
        this("New Conversation");
    }
}
