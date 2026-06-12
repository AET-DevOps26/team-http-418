package tum.devops.http418.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String tumId, @NotBlank String password) {
}
