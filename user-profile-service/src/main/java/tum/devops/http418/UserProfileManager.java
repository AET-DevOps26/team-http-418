package tum.devops.http418;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Component
public class UserProfileManager {
    private final ObjectMapper objectMapper; // Spring injects this automatically
    static final Logger logger = LoggerFactory.getLogger(UserProfileManager.class);
    private final NamedParameterJdbcTemplate template;
    private final RowMapper<Profile> profileRowMapper;

    UserProfileManager(ObjectMapper objectMapper, NamedParameterJdbcTemplate profilesJdbcTemplate) {
        this.objectMapper = objectMapper;
        this.template = profilesJdbcTemplate;
        this.profileRowMapper = new ProfileRowMapper();
    }

    public Profile get(String tumId) {
        final MapSqlParameterSource parameters = new MapSqlParameterSource("id", tumId);
        return template.queryForObject("SELECT * FROM profiles where id = :id", parameters, profileRowMapper);
    }

    public void upsert(String id, Profile profile) {
        if (profile == null) {
            throw new IllegalArgumentException("Profile cannot be null");
        }
        String sql = """
                MERGE INTO profiles AS target
                        USING (VALUES (
                            CAST(:id AS TEXT),
                            CAST(:student AS TEXT),
                            CAST(:completed AS TEXT),
                            CAST(:enrolled AS TEXT),
                            CAST(:available AS TEXT),
                            CAST(:limit AS INTEGER),
                            CAST(:category AS TEXT),
                            CAST(:semester AS TEXT)
                        )) AS source (id, student, completed_courses, enrolled_courses, available_courses, "limit", category, semester)
                        ON target.id = source.id
                        WHEN MATCHED THEN UPDATE SET
                            student            = source.student,
                            "limit"            = source."limit",
                            category           = source.category,
                            semester           = source.semester,
                            completed_courses  = source.completed_courses,
                            enrolled_courses   = source.enrolled_courses,
                            available_courses  = source.available_courses
                        WHEN NOT MATCHED THEN INSERT (id, student, completed_courses, enrolled_courses, available_courses, "limit", category, semester)
                        VALUES (source.id, source.student, source.completed_courses, source.enrolled_courses, source.available_courses, source."limit", source.category, source.semester)
                """;

        try {
            final MapSqlParameterSource parameters = new MapSqlParameterSource();
            parameters.addValue("id", id);
            parameters.addValue("student", objectMapper.writeValueAsString(profile.student()));
            parameters.addValue("completed", objectMapper.writeValueAsString(profile.completedCourses()));
            parameters.addValue("enrolled", objectMapper.writeValueAsString(profile.enrolledCourses()));
            parameters.addValue("available", objectMapper.writeValueAsString(profile.availableCourses()));
            parameters.addValue("limit", profile.limit());
            parameters.addValue("category", profile.category());
            parameters.addValue("semester", profile.semesterKey());

            template.update(sql, parameters);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize Profile properties to JSON for Upsert operation", e);
        }
    }

    private class ProfileRowMapper implements RowMapper<Profile> {
        @Override
        public Profile mapRow(ResultSet rs, int rowNum) throws SQLException {
            try {
                // Deserialize the nested Student object from JSON string
                Profile.Student student = objectMapper.readValue(
                        rs.getString("student"),
                        Profile.Student.class
                );

                // Deserialize the Lists using TypeReferences
                List<String> completed = objectMapper.readValue(
                        rs.getString("completed_courses"),
                        new TypeReference<List<String>>() {
                        }
                );

                List<String> enrolled = objectMapper.readValue(
                        rs.getString("enrolled_courses"),
                        new TypeReference<List<String>>() {
                        }
                );

                List<String> available = objectMapper.readValue(
                        rs.getString("available_courses"),
                        new TypeReference<List<String>>() {
                        }
                );

                // Build and return the final Profile record
                return new Profile(
                        student,
                        completed,
                        enrolled,
                        available,
                        rs.getInt("limit"),
                        rs.getString("category"),
                        rs.getString("semester")
                );
            } catch (Exception e) {
                throw new SQLException("Failed to deserialize JSON columns for Profile mapping", e);
            }
        }
    }
}
