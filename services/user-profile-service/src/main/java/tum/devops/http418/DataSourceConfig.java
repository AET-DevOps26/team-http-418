package tum.devops.http418;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

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
import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

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
	public DataSource profileDataSource() {
		createProfilesDatabaseIfNotExists();
		final HikariDataSource dataSource = configureDataSource("/profiles");

		final JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
		try {
			jdbcTemplate.execute("SELECT version();");
		} catch (CannotGetJdbcConnectionException e) {
			logger.error("Could not connect to database", e);
			throw new RuntimeException("Could not connect to database 'profiles'");
		}

		return dataSource;
	}

	private @NonNull HikariDataSource configureDataSource(String databaseName) {
		final HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + databaseName);
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");
		dataSource.setMaximumPoolSize(10);
		dataSource.setMinimumIdle(2);

		dataSource.setConnectionTimeout(30_000);
		dataSource.setValidationTimeout(5_000);
		dataSource.setIdleTimeout(600_000);
		dataSource.setMaxLifetime(1_800_000);
		dataSource.setKeepaliveTime(300_000);
		return dataSource;
	}

	@Bean
	@Profile("!test")
	public Flyway profilesFlyway(@Qualifier("profileDataSource") DataSource dataSource) {
		final Flyway flyway = Flyway.configure()
				.dataSource(dataSource)
				.locations("classpath:db/migration/profiles")
				.baselineOnMigrate(true)
				.baselineVersion("0")
				.load();
		flyway.migrate();
		return flyway;
	}

	private void createProfilesDatabaseIfNotExists() {
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
						Boolean.class, "profiles");
				if (Boolean.FALSE.equals(exists)) {
					jdbcTemplate.execute("CREATE DATABASE profiles");
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
	public NamedParameterJdbcTemplate profilesJdbcTemplate(@Qualifier("profileDataSource") DataSource dataSource) {
		return new NamedParameterJdbcTemplate(dataSource);
	}
}
