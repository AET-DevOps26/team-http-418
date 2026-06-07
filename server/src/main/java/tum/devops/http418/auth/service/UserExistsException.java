package tum.devops.http418.auth.service;
import jakarta.annotation.Nullable;
import org.springframework.security.core.AuthenticationException;


public class UserExistsException extends AuthenticationException {
    public UserExistsException(@Nullable String msg) {
        super(msg);
    }
}
