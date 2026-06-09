package tum.devops.http418.data;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataSourceConfig {
	String baseUrl = System.getenv("SPRING_DATASOURCE_URL");
	String username = System.getenv("SPRING_DATASOURCE_USERNAME");
	String password = System.getenv("SPRING_DATASOURCE_PASSWORD");

	@Bean
	@Primary
	public DataSource coursesDataSource() {
		HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + "/courses-data");
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");
		dataSource.setReadOnly(true);

		return dataSource;
	}

	private void createSecurityDatabaseIfNotExists() {
		HikariDataSource adminDataSource = new HikariDataSource();

		adminDataSource.setJdbcUrl(baseUrl + "/postgres");
		adminDataSource.setUsername(username);
		adminDataSource.setPassword(password);
		adminDataSource.setDriverClassName("org.postgresql.Driver");

		JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);

		Boolean exists = jdbcTemplate.queryForObject("SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
				Boolean.class, "security");

		if (Boolean.FALSE.equals(exists)) {
			jdbcTemplate.execute("CREATE DATABASE security");
		}

		adminDataSource.close();
	}

	@Bean
	public DataSource securityDataSource() {
		createSecurityDatabaseIfNotExists();
		HikariDataSource dataSource = new HikariDataSource();

		dataSource.setJdbcUrl(baseUrl + "/security");
		dataSource.setUsername(username);
		dataSource.setPassword(password);
		dataSource.setDriverClassName("org.postgresql.Driver");

		JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);

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
		return dataSource;
	}

	@Bean
	public JdbcTemplate coursesJdbcTemplate(@Qualifier("coursesDataSource") DataSource dataSource) {
		return new JdbcTemplate(dataSource);
	}

	@Bean
	public JdbcTemplate securityJdbcTemplate(@Qualifier("securityDataSource") DataSource dataSource) {
		return new JdbcTemplate(dataSource);
	}
}
