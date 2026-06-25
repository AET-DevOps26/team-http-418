package tum.devops.http418;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;

import javax.sql.DataSource;

@TestConfiguration
public class TestConfig {
    @Bean
    @Primary
    public DataSource dataSource() {
        // Creates an in-memory H2 database
        return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).build();
    }

    @Profile("test")
    @Bean(name = "profileJdbcTemplate")
    @Primary
    public NamedParameterJdbcTemplate profileJdbcTemplate(DataSource dataSource) {
        final NamedParameterJdbcTemplate jdbcTemplate = new NamedParameterJdbcTemplate(dataSource);
        // Manually run the schema creation for the in-memory DB if needed
        jdbcTemplate.getJdbcOperations()
                .execute("""
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
        return jdbcTemplate;
    }
}
