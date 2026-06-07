package tum.devops.http418.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.auth.dto.AuthResponse;
import tum.devops.http418.auth.dto.ErrorResponse;
import tum.devops.http418.auth.dto.LoginRequest;
import tum.devops.http418.auth.dto.RefreshRequest;
import tum.devops.http418.auth.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /auth/login
     *
     * Request:
     * {
     *   "tumId": "ga12abc",
     *   "password": "string"
     * }
     *
     * Response:
     * {
     *   "accessToken": "...",
     *   "refreshToken": "...",
     *   "expiresIn": 3600
     * }
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.tumId(), request.password());
    }

    /**
     * POST /auth/register
     * Request:
     * {
     *   "tumId": "ga12abc",
     *   "password": "string"
     * }
     *
     * Response:
     * {
     *   "accessToken": "...",
     *   "refreshToken": "...",
     *   "expiresIn": 3600
     * }
     */

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody LoginRequest request) {
        return authService.register(request.tumId(), request.password());
    }

    /**
     * POST /auth/refresh
     *
     * Request:
     * {
     *   "refreshToken": "..."
     * }
     *
     * Response has the same shape as login.
     */

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    /**
     *
     * POST /auth/logout
     *
     * Request:
     * {
     *   "refreshToken": "..."
     * }
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of("unauthorized", "Invalid credentials or refresh token"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationError() {
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of("bad_request", "Missing or invalid request body"));
    }
}