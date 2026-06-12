package tum.devops.http418.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtTokenProvider jwtTokenProvider;

	@Override
	protected final void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {
		String token = extractBearerToken(request);

		if (token != null && jwtTokenProvider.validate(token)) {
			String tumId = jwtTokenProvider.getUsername(token);

			UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(tumId, null,
					List.of(new SimpleGrantedAuthority(Roles.USER)));

			SecurityContextHolder.getContext().setAuthentication(authentication);
		}

		filterChain.doFilter(request, response);
	}

	private @Nullable String extractBearerToken(@NonNull HttpServletRequest request) {
		String header = request.getHeader("Authorization");

		if (header == null || !header.startsWith("Bearer ")) {
			return null;
		}

		return header.substring(7);
	}
}
