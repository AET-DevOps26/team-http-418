package tum.devops.http418.auth.service;

import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tum.devops.http418.api.dto.Profile;
import tum.devops.http418.auth.dto.AuthResponse;
import tum.devops.http418.auth.dto.InvalidRefreshTokenException;
import tum.devops.http418.auth.security.JwtTokenProvider;

import static tum.devops.http418.Http418Application.PROFILE_SERVICE;
import static tum.devops.http418.Http418Application.restClient;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final AuthenticationManager authenticationManager;
	private final DBUserDetailsManager userDetailsService;
	private final JwtTokenProvider jwtTokenProvider;
	private final InMemoryRefreshTokenStore refreshTokenStore;
	private final PasswordEncoder passwordEncoder;
	private final Logger logger = LoggerFactory.getLogger(AuthService.class);
	private final Environment environment;

	public AuthResponse login(String tumId, String password) {
		final Authentication authentication = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(tumId, password));

		final String accessToken = jwtTokenProvider.generateAccessToken(authentication);
		final String refreshToken = refreshTokenStore.create(authentication.getName());

		return new AuthResponse(accessToken, refreshToken, jwtTokenProvider.getAccessTokenTtlSeconds());
	}

	public AuthResponse refresh(String refreshToken) {
		try {
			final String tumId = refreshTokenStore.consume(refreshToken)
					.orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));
			final UserDetails userDetails = userDetailsService.loadUserByUsername(tumId);

			final Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
					userDetails.getAuthorities());

			final String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);
			final String newRefreshToken = refreshTokenStore.create(tumId);

			return new AuthResponse(newAccessToken, newRefreshToken, jwtTokenProvider.getAccessTokenTtlSeconds());
		} catch (Exception e) {
			logger.error("Invalid refresh token | {}", e.getMessage());
			throw e;
		}
	}

	public void logout(String refreshToken) {
		refreshTokenStore.revoke(refreshToken);
	}

	public AuthResponse register(@NotBlank String tumid, @NotBlank String password) {
		if (userDetailsService.userExists(tumid)) {
			throw new UserExistsException("User already exists");
		}
		userDetailsService
				.createUser(User.withUsername(tumid).password(passwordEncoder.encode(password)).roles("USER").build());

		if (!environment.acceptsProfiles(Profiles.of("test"))) { // do not attempt to create an empty profile when running tests
			var exists = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve()
					.onStatus(HttpStatusCode::isError, (request, response) -> {
					}).toBodilessEntity()
					.getStatusCode();
			if (exists.isSameCodeAs(HttpStatus.NOT_FOUND)) {
				var code = restClient.post().uri(PROFILE_SERVICE + "/upsert/" + tumid).body(new Profile()).retrieve()
						.toBodilessEntity().getStatusCode();
				if (!code.is2xxSuccessful()) {
					throw new RuntimeException("Failed to create empty profile");
				}
				logger.info("Created empty profile for {}", tumid);
			}
		}
		return login(tumid, password);
	}

	@Bean
	public CommandLineRunner createTestUser() {
		final String admin = "admin";
		return args -> {
			try {
				if (!userDetailsService.userExists(admin)) {
					register(admin, "test");
				}
				if (!environment.acceptsProfiles(Profiles.of("test"))) {
					var profileExists = restClient.get().uri(PROFILE_SERVICE + "/get/" + admin).retrieve()
							.onStatus(HttpStatusCode::isError, (request, response) -> {
							}).toBodilessEntity().getStatusCode();
					if (profileExists.isSameCodeAs(HttpStatus.NOT_FOUND)) {
						var code = restClient.post().uri(PROFILE_SERVICE + "/upsert/" + admin).body(new Profile())
								.retrieve()
								.toBodilessEntity().getStatusCode();
						if (!code.is2xxSuccessful()) {
							throw new RuntimeException("Failed to create empty profile");
						}
						logger.info("Created empty profile for {}", admin);
					}
				}
			} catch (Exception e) {
				logger.warn("Could not create test user or profile (profile-service may be unavailable): {}",
						e.getMessage());
			}
		};
	}
}
