package tum.devops.http418.auth.service;

import jakarta.validation.constraints.NotBlank;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tum.devops.http418.auth.dto.AuthResponse;
import tum.devops.http418.auth.security.JwtTokenProvider;

@Service
public class AuthService {

	private final AuthenticationManager authenticationManager;
	private final DBUserDetailsManager userDetailsService;
	private final JwtTokenProvider jwtTokenProvider;
	private final InMemoryRefreshTokenStore refreshTokenStore;
	private final PasswordEncoder passwordEncoder;

	public AuthService(AuthenticationManager authenticationManager, DBUserDetailsManager userDetailsService,
			JwtTokenProvider jwtTokenProvider, InMemoryRefreshTokenStore refreshTokenStore,
			PasswordEncoder passwordEncoder) {
		this.authenticationManager = authenticationManager;
		this.userDetailsService = userDetailsService;
		this.jwtTokenProvider = jwtTokenProvider;
		this.refreshTokenStore = refreshTokenStore;
		this.passwordEncoder = passwordEncoder;
	}

	public AuthResponse login(String tumId, String password) {
		Authentication authentication = authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(tumId, password));

		String accessToken = jwtTokenProvider.generateAccessToken(authentication);
		String refreshToken = refreshTokenStore.create(authentication.getName());

		return new AuthResponse(accessToken, refreshToken, jwtTokenProvider.getAccessTokenTtlSeconds());
	}

	public AuthResponse refresh(String refreshToken) {
		String tumId = refreshTokenStore.consume(refreshToken)
				.orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

		var userDetails = userDetailsService.loadUserByUsername(tumId);

		Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
				userDetails.getAuthorities());

		String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);
		String newRefreshToken = refreshTokenStore.create(tumId);

		return new AuthResponse(newAccessToken, newRefreshToken, jwtTokenProvider.getAccessTokenTtlSeconds());
	}

	public void logout(String refreshToken) {
		refreshTokenStore.revoke(refreshToken);
	}

	public AuthResponse register(@NotBlank String tumid, @NotBlank String password) {
		if (userDetailsService.userExists(tumid)) {
			throw new UserExistsException("User already exists");
		}
		userDetailsService.createUser(
				User.withUsername(tumid).password(passwordEncoder.encode(password)).roles("USER").build());
		return login(tumid, password);
	}
}
