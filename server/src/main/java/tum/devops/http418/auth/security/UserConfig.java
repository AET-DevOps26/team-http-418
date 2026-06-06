package tum.devops.http418.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class UserConfig {

    /**
     * Temporary local user store.
     * Replace this with a real UserDetailsService later:
     * - database lookup
     * - TUM ID lookup
     * - OAuth2 / Shibboleth bridge
     */
    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("ga12abc")
                        .password(passwordEncoder.encode("string"))
                        .roles("USER")
                        .build()
        );
    }
}
