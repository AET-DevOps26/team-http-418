package tum.devops.http418.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresIn
) {
}