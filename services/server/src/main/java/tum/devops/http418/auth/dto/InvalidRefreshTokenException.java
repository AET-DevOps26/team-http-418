package tum.devops.http418.auth.dto;

import org.springframework.security.core.AuthenticationException;

public class InvalidRefreshTokenException extends AuthenticationException {
	public InvalidRefreshTokenException(String invalidRefreshToken) {
		super(invalidRefreshToken);
	}
}
