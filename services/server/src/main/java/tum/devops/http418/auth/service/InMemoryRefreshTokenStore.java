package tum.devops.http418.auth.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InMemoryRefreshTokenStore {

	private final Map<String, RefreshTokenData> tokens = new ConcurrentHashMap<>();
	private final SecureRandom secureRandom = new SecureRandom();
	private final long refreshTokenTtlSeconds;

	public InMemoryRefreshTokenStore(@Value("${app.refresh-token.ttl-seconds}") long refreshTokenTtlSeconds) {
		this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
	}

	public String create(String tumId) {
		final String token = generateToken();

		tokens.put(token, new RefreshTokenData(tumId, Instant.now().plusSeconds(refreshTokenTtlSeconds)));

		return token;
	}

	/**
	 * Rotation behavior: - valid token is consumed - old token is removed - caller
	 * creates a new token
	 */
	public Optional<String> consume(String token) {
		if (token == null || token.isBlank()) {
			return Optional.empty();
		}

		final RefreshTokenData data = tokens.remove(token);

		if (data == null || data.isExpired()) {
			return Optional.empty();
		}

		return Optional.of(data.tumId());
	}

	public void revoke(String token) {
		if (token != null) {
			tokens.remove(token);
		}
	}

	private String generateToken() {
		final byte[] bytes = new byte[64];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	private record RefreshTokenData(String tumId, Instant expiresAt) {
		boolean isExpired() {
			return Instant.now().isAfter(expiresAt);
		}
	}
}
