package tum.devops.http418.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class UserConfig {

    /** todo remove this file
     * Temporary local user store.
     * Replace this with a real UserDetailsService later:
     * - database lookup
     * - TUM ID lookup
     * - OAuth2 / Shibboleth bridge
     */
    @Bean
    public InMemoryUserDetailsManager userDetailsService() {
        return new InMemoryUserDetailsManager();
    }
}
