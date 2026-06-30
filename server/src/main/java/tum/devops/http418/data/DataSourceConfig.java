package tum.devops.http418.data;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@Slf4j
@Configuration
public class DataSourceConfig {

	private final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

	@Value("${SPRING_DATASOURCE_URL}")
	private String baseUrl;

	@Value("${SPRING_DATASOURCE_USERNAME}")
	private String username;

	@Value("${SPRING_DATASOURCE_PASSWORD}")
	private String password;

	@Bean
	@Primary
	@Profile("!test")
	public DataSource coursesDataSource() {
		final HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + "/courses-data");
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");
		dataSource.setReadOnly(true);

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
		try {
			jdbcTemplate.execute("SELECT version();");
		} catch (CannotGetJdbcConnectionException e) {
			logger.error("Could not connect to database", e);
			throw new RuntimeException("Could not connect to database 'courses-data'");
		}

		return dataSource;
	}

	private void createSecurityDatabaseIfNotExists() {
		final HikariDataSource adminDataSource = new HikariDataSource();

		adminDataSource.setJdbcUrl(baseUrl + "/postgres");
		adminDataSource.setUsername(username);
		adminDataSource.setPassword(password);
		adminDataSource.setDriverClassName("org.postgresql.Driver");

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);

		final Boolean exists = jdbcTemplate.queryForObject(
				"SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
				Boolean.class, "security");

		if (Boolean.FALSE.equals(exists)) {
			jdbcTemplate.execute("CREATE DATABASE security");
		}

		adminDataSource.close();
	}

	@Bean
	@Profile("!test")
	public DataSource securityDataSource() {
		createSecurityDatabaseIfNotExists();
		final HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + "/security");
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

		try {
			jdbcTemplate.execute("SELECT version();");
		} catch (CannotGetJdbcConnectionException e) {
			logger.error("Could not connect to database", e);
			throw new RuntimeException("Could not connect to database 'security'");
		}

		jdbcTemplate.execute("""
				    CREATE TABLE IF NOT EXISTS credentials (
				        username TEXT PRIMARY KEY,
				        password TEXT NOT NULL
				    )
				""");

		jdbcTemplate.execute("""
				    CREATE TABLE IF NOT EXISTS user_authorities (
				        username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
				        authority TEXT NOT NULL,
				        PRIMARY KEY (username, authority)
				    )
				""");

		// TODO dev login test
		jdbcTemplate.execute("""
						INSERT INTO credentials (username, password) VALUES ('admin', 'test') ON CONFLICT DO NOTHING;
				""");
		return dataSource;
	}

	@Bean
	@Profile("!test")
	public NamedParameterJdbcTemplate coursesJdbcTemplate(@Qualifier("coursesDataSource") DataSource dataSource) {
		return new NamedParameterJdbcTemplate(dataSource);
	}

	@Bean
	@Profile("!test")
	public NamedParameterJdbcTemplate securityJdbcTemplate(@Qualifier("securityDataSource") DataSource dataSource) {
		return new NamedParameterJdbcTemplate(dataSource);
	}
}
