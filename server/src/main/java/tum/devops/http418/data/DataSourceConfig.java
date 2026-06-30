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

	private void createCoursesDatabaseIfNotExists() {
		final HikariDataSource adminDataSource = new HikariDataSource();

		adminDataSource.setJdbcUrl(baseUrl + "/postgres");
		adminDataSource.setUsername(username);
		adminDataSource.setPassword(password);
		adminDataSource.setDriverClassName("org.postgresql.Driver");

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);

		final Boolean exists = jdbcTemplate.queryForObject(
				"SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
				Boolean.class, "courses-data");

		if (Boolean.FALSE.equals(exists)) {
			jdbcTemplate.execute("CREATE DATABASE \"courses-data\"");
		}

		adminDataSource.close();
	}

	@Bean
	@Primary
	@Profile("!test")
	public DataSource coursesDataSource() {
		createCoursesDatabaseIfNotExists();
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

		jdbcTemplate.execute("""
				CREATE TABLE IF NOT EXISTS student_completed_courses (
				    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
				    username TEXT NOT NULL REFERENCES credentials(username) ON DELETE CASCADE,
				    course_id BIGINT NOT NULL,
				    grade NUMERIC(2,1) CHECK (grade >= 0),
				    credits INT NOT NULL DEFAULT 0 CHECK (credits >= 0),
				    semester_key TEXT,
				    category TEXT,
				    UNIQUE (username, course_id)
				)
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
