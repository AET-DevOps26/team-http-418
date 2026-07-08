package tum.devops.http418.data;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
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

	private void createCoursesDatabaseIfNotExists() {
		final int maxAttempts = 10;
		for (int attempt = 1; attempt <= maxAttempts; attempt++) {
			HikariDataSource adminDataSource = null;
			try {
				adminDataSource = new HikariDataSource();
				adminDataSource.setJdbcUrl(baseUrl + "/postgres");
				adminDataSource.setUsername(username);
				adminDataSource.setPassword(password);
				adminDataSource.setDriverClassName("org.postgresql.Driver");
				adminDataSource.setMaximumPoolSize(1);
				adminDataSource.setInitializationFailTimeout(5000);

				final JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);
				final Boolean exists = jdbcTemplate.queryForObject(
						"SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
						Boolean.class, "courses-data");
				if (Boolean.FALSE.equals(exists)) {
					jdbcTemplate.execute("CREATE DATABASE \"courses-data\"");
				}
				return;
			} catch (Exception e) {
				logger.warn("DB not ready (attempt {}/{}): {}", attempt, maxAttempts, e.getMessage());
				if (attempt == maxAttempts) {
					throw new RuntimeException("Could not connect to database after " + maxAttempts + " attempts", e);
				}
				try {
					Thread.sleep(2000L * attempt);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
					throw new RuntimeException("Interrupted while waiting for database readiness", ie);
				}
			} finally {
				if (adminDataSource != null) {
					adminDataSource.close();
				}
			}
		}
	}

	@Bean
	@Primary
	@Profile("!test")
	public DataSource coursesDataSource() {
		createCoursesDatabaseIfNotExists();
		final HikariDataSource dataSource = configureDataSource("/courses-data", true);

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
		try {
			jdbcTemplate.execute("SELECT version();");
		} catch (CannotGetJdbcConnectionException e) {
			logger.error("Could not connect to database", e);
			throw new RuntimeException("Could not connect to database 'courses-data'");
		}

		return dataSource;
	}

	private @NonNull HikariDataSource configureDataSource(String databaseName, boolean readOnly) {
		final HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + databaseName);
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");
		dataSource.setReadOnly(readOnly);
		dataSource.setMaximumPoolSize(10);
		dataSource.setMinimumIdle(2);

		dataSource.setConnectionTimeout(30_000);
		dataSource.setValidationTimeout(5_000);
		dataSource.setIdleTimeout(600_000);
		dataSource.setMaxLifetime(1_800_000);
		dataSource.setKeepaliveTime(300_000);
		return dataSource;
	}

	private void createSecurityDatabaseIfNotExists() {
		final int maxAttempts = 10;
		for (int attempt = 1; attempt <= maxAttempts; attempt++) {
			HikariDataSource adminDataSource = null;
			try {
				adminDataSource = new HikariDataSource();
				adminDataSource.setJdbcUrl(baseUrl + "/postgres");
				adminDataSource.setUsername(username);
				adminDataSource.setPassword(password);
				adminDataSource.setDriverClassName("org.postgresql.Driver");
				adminDataSource.setMaximumPoolSize(1);
				adminDataSource.setInitializationFailTimeout(5000);

				final JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);
				final Boolean exists = jdbcTemplate.queryForObject(
						"SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
						Boolean.class, "security");
				if (Boolean.FALSE.equals(exists)) {
					jdbcTemplate.execute("CREATE DATABASE security");
				}
				return;
			} catch (Exception e) {
				logger.warn("DB not ready (attempt {}/{}): {}", attempt, maxAttempts, e.getMessage());
				if (attempt == maxAttempts) {
					throw new RuntimeException("Could not connect to database after " + maxAttempts + " attempts", e);
				}
				try {
					Thread.sleep(2000L * attempt);
				} catch (InterruptedException ie) {
					Thread.currentThread().interrupt();
					throw new RuntimeException("Interrupted while waiting for database readiness", ie);
				}
			} finally {
				if (adminDataSource != null) {
					adminDataSource.close();
				}
			}
		}
	}

	@Bean
	@Profile("!test")
	public DataSource securityDataSource() {
		createSecurityDatabaseIfNotExists();
		final HikariDataSource dataSource = configureDataSource("/security", false);

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

			jdbcTemplate.execute("""
					CREATE TABLE IF NOT EXISTS student_completed_courses (
					    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
					    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
				    course_id BIGINT,
				    grade NUMERIC(2,1) CHECK (grade >= 0),
				    credits INT NOT NULL DEFAULT 0 CHECK (credits >= 0),
				    semester_key TEXT,
				    category TEXT,
				    status TEXT NOT NULL DEFAULT 'confirmed',
				    module_id TEXT,
					    module_title TEXT
					)
					""");
			jdbcTemplate.execute("ALTER TABLE student_completed_courses ALTER COLUMN course_id DROP NOT NULL");
			jdbcTemplate.execute(
					"ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed'");
			jdbcTemplate.execute("ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS module_id TEXT");
			jdbcTemplate.execute("ALTER TABLE student_completed_courses ADD COLUMN IF NOT EXISTS module_title TEXT");
			jdbcTemplate.execute("""
					CREATE UNIQUE INDEX IF NOT EXISTS uq_completed_course
					    ON student_completed_courses (username, course_id) WHERE course_id IS NOT NULL
					""");
		jdbcTemplate.execute("""
				CREATE UNIQUE INDEX IF NOT EXISTS uq_unmatched_module
				    ON student_completed_courses (username, module_id)
				    WHERE module_id IS NOT NULL AND course_id IS NULL
				""");

		jdbcTemplate.execute("""
				CREATE TABLE IF NOT EXISTS student_enrolled_courses (
				    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
				    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
				    course_id BIGINT NOT NULL,
				    semester_key TEXT,
				    UNIQUE (username, course_id)
				)
				""");

		jdbcTemplate.execute("""
				CREATE TABLE IF NOT EXISTS advisor_conversations (
				    id TEXT PRIMARY KEY,
				    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
				    title TEXT NOT NULL DEFAULT 'New Conversation',
				    created_at TIMESTAMP DEFAULT now(),
				    updated_at TIMESTAMP DEFAULT now()
				)
				""");

		jdbcTemplate.execute("""
				CREATE TABLE IF NOT EXISTS advisor_messages (
				    id TEXT PRIMARY KEY,
				    conversation_id TEXT NOT NULL REFERENCES advisor_conversations(id) ON DELETE CASCADE,
				    role TEXT NOT NULL,
				    content TEXT NOT NULL,
				    referenced_courses TEXT DEFAULT '[]',
				    created_at TIMESTAMP DEFAULT now()
				)
				""");

		jdbcTemplate.execute("""
				CREATE TABLE IF NOT EXISTS student_roadmaps (
				    username TEXT PRIMARY KEY REFERENCES credentials(username) ON DELETE CASCADE,
				    roadmap_json TEXT NOT NULL,
				    status TEXT NOT NULL DEFAULT 'EMPTY',
				    created_at TIMESTAMP DEFAULT now(),
				    updated_at TIMESTAMP DEFAULT now()
				)
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
