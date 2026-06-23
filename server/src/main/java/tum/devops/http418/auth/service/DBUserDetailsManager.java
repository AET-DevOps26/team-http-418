package tum.devops.http418.auth.service;

import java.util.List;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcOperations;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DBUserDetailsManager implements UserDetailsManager {

	private final NamedParameterJdbcTemplate namedParameterJdbcTemplate_;
	private final JdbcOperations jdbcTemplate;
	private final PasswordEncoder passwordEncoder;

	public DBUserDetailsManager(@Qualifier("securityJdbcTemplate") NamedParameterJdbcTemplate jdbcTemplate,
			PasswordEncoder passwordEncoder) {
		this.namedParameterJdbcTemplate_ = jdbcTemplate;
		this.jdbcTemplate = jdbcTemplate.getJdbcOperations();
		this.passwordEncoder = passwordEncoder;
	}

	@Override
	@Transactional
	public void createUser(@NonNull UserDetails user) {
		if (userExists(user.getUsername())) {
			throw new IllegalArgumentException("User already exists: " + user.getUsername());
		}

		jdbcTemplate.update("""
				INSERT INTO credentials (
				    username,
				    password
				)
				VALUES (?, ?)
				""", user.getUsername(), user.getPassword());

		insertAuthorities(user);
	}

	@Override
	@Transactional
	public void updateUser(@NonNull UserDetails user) {
		if (!userExists(user.getUsername())) {
			throw new UsernameNotFoundException("User not found: " + user.getUsername());
		}

		jdbcTemplate.update("""
				UPDATE credentials
				SET password = ?
				WHERE username = ?
				""", user.getPassword(), user.getUsername());

		jdbcTemplate.update("DELETE FROM user_authorities WHERE username = ?", user.getUsername());

		insertAuthorities(user);
	}

	@Override
	@Transactional
	public void deleteUser(@NonNull String username) {
		jdbcTemplate.update("DELETE FROM credentials WHERE username = ?", username);
	}

	@Override
	@Transactional
	public void changePassword(@NonNull String oldPassword, @NonNull String newPassword) {
		final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

		if (authentication == null || authentication.getName() == null) {
			throw new IllegalStateException("No authenticated user found");
		}

		final String username = authentication.getName();
		final UserDetails currentUser = loadUserByUsername(username);

		if (!passwordEncoder.matches(oldPassword, currentUser.getPassword())) {
			throw new IllegalArgumentException("Old password is incorrect");
		}

		final String encodedNewPassword = passwordEncoder.encode(newPassword);

		jdbcTemplate.update("UPDATE credentials SET password = ? WHERE username = ?", encodedNewPassword, username);
	}

	@Override
	public boolean userExists(@NonNull String username) {
		final Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM credentials WHERE username = ?",
				Integer.class, username);

		return count != null && count > 0;
	}

	@Override
	public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
		final List<UserDetails> users = jdbcTemplate.query("""
				SELECT username,
				       password
				FROM credentials
				WHERE username = ?
				""", (rs, rowNum) -> User.withUsername(rs.getString("username")).password(rs.getString("password"))
				.authorities(loadAuthorities(rs.getString("username"))).build(), username);

		if (users.isEmpty()) {
			throw new UsernameNotFoundException("User not found: " + username);
		}

		return users.getFirst();
	}

	private void insertAuthorities(UserDetails user) {
		for (GrantedAuthority authority : user.getAuthorities()) {
			jdbcTemplate.update("INSERT INTO user_authorities (username, authority) VALUES (?, ?)", user.getUsername(),
					authority.getAuthority());
		}
	}

	private String[] loadAuthorities(String username) {
		final List<String> authorities = jdbcTemplate
				.queryForList("SELECT authority FROM user_authorities WHERE username = ?", String.class, username);

		return authorities.toArray(String[]::new);
	}
}
