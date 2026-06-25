package tum.devops.http418;

import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;

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
        final HikariDataSource dataSource = new HikariDataSource();

        dataSource.setJdbcUrl(baseUrl + "/profiles");
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setReadOnly(true);

        final JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        try {
            jdbcTemplate.execute("SELECT version();");
        } catch (CannotGetJdbcConnectionException e) {
            logger.error("Could not connect to database", e);
            throw new RuntimeException("Could not connect to database 'profiles'");
        }

        return dataSource;
    }

    private void createProfilesDatabaseIfNotExists() {
        final HikariDataSource adminDataSource = new HikariDataSource();

        adminDataSource.setJdbcUrl(baseUrl + "/postgres");
        adminDataSource.setUsername(username);
        adminDataSource.setPassword(password);
        adminDataSource.setDriverClassName("org.postgresql.Driver");

        final JdbcTemplate jdbcTemplate = new JdbcTemplate(adminDataSource);

        final Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ?)",
                Boolean.class, "profiles");

        if (Boolean.FALSE.equals(exists)) {
            jdbcTemplate.execute("CREATE DATABASE profiles");
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS profiles (
                                                  id TEXT PRIMARY KEY,
                                                  student TEXT NOT NULL,
                                                  completed_courses TEXT NOT NULL,
                                                  enrolled_courses TEXT NOT NULL,
                                                  available_courses TEXT NOT NULL,
                                                  "limit" INT NOT NULL,
                                                  category TEXT,
                                                  semester TEXT
                                              );
                    """);
        }

        adminDataSource.close();
    }

    @Bean
    @Profile("!test")
    public NamedParameterJdbcTemplate profilesJdbcTemplate(@Qualifier("profileDataSource") DataSource dataSource) {
        return new NamedParameterJdbcTemplate(dataSource);
    }
}
