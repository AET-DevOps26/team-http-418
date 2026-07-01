package tum.devops.http418.api;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.auth.dto.*;
import tum.devops.http418.auth.service.AuthService;
import tum.devops.http418.auth.service.UserExistsException;

@RestController
@RequestMapping("/api/${API_VERSION}/auth")
public class AuthController {
	private final Logger logger = LoggerFactory.getLogger(AuthController.class);
	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	/**
	 * POST /auth/login
	 *
	 * <p>
	 * Request: { "tumId": "ga12abc", "password": "string" }
	 *
	 * <p>
	 * Response: { "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 }
	 */
	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request.tumId(), request.password());
	}

	/**
	 * POST /auth/register Request: { "tumId": "ga12abc", "password": "string" }
	 *
	 * <p>
	 * Response: { "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 }
	 */
	@PostMapping("/register")
	public AuthResponse register(@Valid @RequestBody LoginRequest request) {
		return authService.register(request.tumId(), request.password());
	}

	/**
	 * POST /auth/refresh
	 *
	 * <p>
	 * Request: { "refreshToken": "..." }
	 *
	 * <p>
	 * Response has the same shape as login.
	 */
	@PostMapping("/refresh")
	public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request.refreshToken());
	}

	/**
	 * POST /auth/logout
	 *
	 * <p>
	 * Request: { "refreshToken": "..." }
	 */
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
		authService.logout(request.refreshToken());
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e) {
		logger.error(e.getMessage());
		return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(ErrorResponse.of("unauthorized", "Invalid credentials"));
	}

	@ExceptionHandler(InvalidRefreshTokenException.class)
	public ResponseEntity<ErrorResponse> handleInvalidRefreshToken(InvalidRefreshTokenException e) {
		logger.error(e.getMessage());
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ErrorResponse.of("bad_request", "Invalid refresh token"));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidationError() {
		return ResponseEntity.badRequest().body(ErrorResponse.of("bad_request", "Missing or invalid request body"));
	}

	@ExceptionHandler(UserExistsException.class)
	public ResponseEntity<ErrorResponse> handleUserExists() {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse.of("conflict", "User already exists"));
	}
}
