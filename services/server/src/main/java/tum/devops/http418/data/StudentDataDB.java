package tum.devops.http418.data;

import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.api.dto.SimpleCourseData;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class StudentDataDB {

	private final NamedParameterJdbcTemplate template;
	private final CoursesDataDB coursesDataDB;
	private final ObjectMapper objectMapper;
	private final Logger logger = LoggerFactory.getLogger(StudentDataDB.class);

	public StudentDataDB(@Qualifier("securityJdbcTemplate") NamedParameterJdbcTemplate template,
			CoursesDataDB coursesDataDB, ObjectMapper objectMapper) {
		this.template = template;
		this.coursesDataDB = coursesDataDB;
		this.objectMapper = objectMapper;
	}

	// --- Completed courses ---

	public record CompletedCourseRow(long id, String username, long courseId, BigDecimal grade, int credits,
			String semesterKey, String category) {
	}

	public List<CompletedCourseRow> getCompletedCourses(String username, int page, int size) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("limit", size);
		params.addValue("offset", Math.max(0, page) * size);
		return template.query(
				"SELECT id, username, course_id AS courseId, grade, credits, semester_key AS semesterKey, category FROM student_completed_courses WHERE username = :username ORDER BY id LIMIT :limit OFFSET :offset",
				params, new DataClassRowMapper<>(CompletedCourseRow.class));
	}

	public int countCompletedCourses(String username) {
		final Integer count = template.queryForObject(
				"SELECT COUNT(*) FROM student_completed_courses WHERE username = :username",
				new MapSqlParameterSource("username", username), Integer.class);
		return count != null ? count : 0;
	}

	public CompletedCourseRow insertCompletedCourse(String username, long courseId, BigDecimal grade, int credits,
			String semesterKey, String category) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("courseId", courseId);
		params.addValue("grade", grade);
		params.addValue("credits", credits);
		params.addValue("semesterKey", semesterKey);
		params.addValue("category", category);
		try {
			template.update(
					"INSERT INTO student_completed_courses (username, course_id, grade, credits, semester_key, category) VALUES (:username, :courseId, :grade, :credits, :semesterKey, :category)",
					params);
		} catch (DuplicateKeyException e) {
			return null;
		}
		final List<CompletedCourseRow> rows = template.query(
				"SELECT id, username, course_id AS courseId, grade, credits, semester_key AS semesterKey, category FROM student_completed_courses WHERE username = :username AND course_id = :courseId",
				params, new DataClassRowMapper<>(CompletedCourseRow.class));
		return rows.isEmpty() ? null : rows.getFirst();
	}

	public int deleteCompletedCourse(String username, long courseId) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("courseId", courseId);
		return template.update(
				"DELETE FROM student_completed_courses WHERE username = :username AND course_id = :courseId",
				params);
	}

	// --- Enrolled courses ---

	public record EnrolledCourseRow(long id, String username, long courseId, String semesterKey) {
	}

	public List<EnrolledCourseRow> getEnrolledCourses(String username, int page, int size) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("limit", size);
		params.addValue("offset", Math.max(0, page) * size);
		return template.query(
				"SELECT id, username, course_id AS courseId, semester_key AS semesterKey FROM student_enrolled_courses WHERE username = :username ORDER BY id LIMIT :limit OFFSET :offset",
				params, new DataClassRowMapper<>(EnrolledCourseRow.class));
	}

	public int countEnrolledCourses(String username) {
		final Integer count = template.queryForObject(
				"SELECT COUNT(*) FROM student_enrolled_courses WHERE username = :username",
				new MapSqlParameterSource("username", username), Integer.class);
		return count != null ? count : 0;
	}

	public EnrolledCourseRow insertEnrolledCourse(String username, long courseId, String semesterKey) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("courseId", courseId);
		params.addValue("semesterKey", semesterKey);
		try {
			template.update(
					"INSERT INTO student_enrolled_courses (username, course_id, semester_key) VALUES (:username, :courseId, :semesterKey)",
					params);
		} catch (DuplicateKeyException e) {
			return null;
		}
		final List<EnrolledCourseRow> rows = template.query(
				"SELECT id, username, course_id AS courseId, semester_key AS semesterKey FROM student_enrolled_courses WHERE username = :username AND course_id = :courseId",
				params, new DataClassRowMapper<>(EnrolledCourseRow.class));
		return rows.isEmpty() ? null : rows.getFirst();
	}

	public int deleteEnrolledCourse(String username, long courseId) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("courseId", courseId);
		return template.update(
				"DELETE FROM student_enrolled_courses WHERE username = :username AND course_id = :courseId",
				params);
	}

	// --- Advisor conversations ---

	public record ConversationRow(String id, String username, String title, Timestamp createdAt, Timestamp updatedAt) {
	}

	public record IntermediateMessageRow(String id, String conversationId, String role, String content,
			String referencedCourses,
			Timestamp createdAt) {
	}

	public record MessageRow(String id, String conversationId, String role, String content,
			List<SimpleCourseData> referencedCourses,
			Timestamp createdAt) {
	}

	public List<ConversationRow> getConversations(String username, int page, int size) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("limit", size);
		params.addValue("offset", Math.max(0, page) * size);
		return template.query(
				"SELECT id, username, title, created_at AS createdAt, updated_at AS updatedAt FROM advisor_conversations WHERE username = :username ORDER BY updated_at DESC LIMIT :limit OFFSET :offset",
				params, new DataClassRowMapper<>(ConversationRow.class));
	}

	public int countConversations(String username) {
		final Integer count = template.queryForObject(
				"SELECT COUNT(*) FROM advisor_conversations WHERE username = :username",
				new MapSqlParameterSource("username", username), Integer.class);
		return count != null ? count : 0;
	}

	public ConversationRow insertConversation(String username, String title) {
		final String id = UUID.randomUUID().toString();
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("id", id);
		params.addValue("username", username);
		params.addValue("title", title != null ? title : "New Conversation");
		template.update(
				"INSERT INTO advisor_conversations (id, username, title) VALUES (:id, :username, :title)", params);
		return template
				.query("SELECT id, username, title, created_at AS createdAt, updated_at AS updatedAt FROM advisor_conversations WHERE id = :id",
						new MapSqlParameterSource("id", id), new DataClassRowMapper<>(ConversationRow.class))
				.getFirst();
	}

	public ConversationRow getConversation(String id, String username) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("id", id);
		params.addValue("username", username);
		final List<ConversationRow> rows = template.query(
				"SELECT id, username, title, created_at AS createdAt, updated_at AS updatedAt FROM advisor_conversations WHERE id = :id AND username = :username",
				params, new DataClassRowMapper<>(ConversationRow.class));
		return rows.isEmpty() ? null : rows.getFirst();
	}

	public List<MessageRow> getMessages(String conversationId) {
		List<IntermediateMessageRow> intermediateRows = template.query(
				"SELECT id, conversation_id AS conversationId, role, content, referenced_courses AS referencedCourses, created_at AS createdAt FROM advisor_messages WHERE conversation_id = :conversationId ORDER BY created_at",
				new MapSqlParameterSource("conversationId", conversationId),
				new DataClassRowMapper<>(IntermediateMessageRow.class));
		List<MessageRow> rows = intermediateRows.stream()// TODO when moving to its own db, this part has to stay here
				.map(row -> {
					List<String> referencedCourseIds = parseJsonList(row.referencedCourses).stream().distinct().toList();
					List<SimpleCourseData> referencedCourses = coursesDataDB.getByIds(referencedCourseIds);
					return new MessageRow(row.id, row.conversationId, row.role, row.content, referencedCourses,
							row.createdAt);
				})
				.toList();
		return rows;
	}

	private List<String> parseJsonList(String jsonString) {
		if (jsonString == null || jsonString.isBlank()) {
			return new ArrayList<>();
		}
		try {
			return objectMapper.readValue(jsonString, new TypeReference<List<String>>() {
			});
		} catch (Exception e) {
			return new ArrayList<>();
		}
	}

	private String toJsonString(List<String> list) {
		if (list == null || list.isEmpty()) {
			return "[]"; // Return an empty JSON array string
		}
		try {
			return objectMapper.writeValueAsString(list);
		} catch (Exception e) {
			logger.error("Failed to serialize list to JSON string", e);
			return "[]"; // Fallback to safe empty array on failure
		}
	}

	public MessageRow insertMessage(String conversationId, String role, String content,
			@NonNull List<String> referencedCourses) {
		final String id = UUID.randomUUID().toString();
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("id", id);
		params.addValue("conversationId", conversationId);
		params.addValue("role", role);
		params.addValue("content", content);
		params.addValue("referencedCourses", toJsonString(referencedCourses));
		template.update(
				"INSERT INTO advisor_messages (id, conversation_id, role, content, referenced_courses) VALUES (:id, :conversationId, :role, :content, :referencedCourses)",
				params);
		template.update("UPDATE advisor_conversations SET updated_at = now() WHERE id = :conversationId",
				new MapSqlParameterSource("conversationId", conversationId));
		IntermediateMessageRow intermediateMessageRow = template
				.query("SELECT id, conversation_id AS conversationId, role, content, referenced_courses AS referencedCourses, created_at AS createdAt FROM advisor_messages WHERE id = :id",
						new MapSqlParameterSource("id", id), new DataClassRowMapper<>(IntermediateMessageRow.class))
				.getFirst();
		List<String> referencedCourseIds = parseJsonList(intermediateMessageRow.referencedCourses).stream().distinct().toList();
		List<SimpleCourseData> referencedCoursesList = coursesDataDB.getByIds(referencedCourseIds);
		return new MessageRow(intermediateMessageRow.id, intermediateMessageRow.conversationId,
				intermediateMessageRow.role, intermediateMessageRow.content, referencedCoursesList,
				intermediateMessageRow.createdAt);
	}

	// --- Roadmap ---

	public record RoadmapRow(String username, String roadmapJson, String status, Timestamp createdAt,
			Timestamp updatedAt) {
	}

	public RoadmapRow getRoadmap(String username) {
		final List<RoadmapRow> rows = template.query(
				"SELECT username, roadmap_json AS roadmapJson, status, created_at AS createdAt, updated_at AS updatedAt FROM student_roadmaps WHERE username = :username",
				new MapSqlParameterSource("username", username), new DataClassRowMapper<>(RoadmapRow.class));
		return rows.isEmpty() ? null : rows.getFirst();
	}

	public void upsertRoadmap(String username, String roadmapJson, String status) {
		final MapSqlParameterSource params = new MapSqlParameterSource();
		params.addValue("username", username);
		params.addValue("roadmapJson", roadmapJson);
		params.addValue("status", status);
		final int updated = template.update(
				"UPDATE student_roadmaps SET roadmap_json = :roadmapJson, status = :status, updated_at = CURRENT_TIMESTAMP WHERE username = :username",
				params);
		if (updated == 0) {
			try {
				template.update(
						"INSERT INTO student_roadmaps (username, roadmap_json, status) VALUES (:username, :roadmapJson, :status)",
						params);
			} catch (DuplicateKeyException e) {
				template.update(
						"UPDATE student_roadmaps SET roadmap_json = :roadmapJson, status = :status, updated_at = CURRENT_TIMESTAMP WHERE username = :username",
						params);
			}
		}
	}

	// --- Progress helpers ---

	public int sumCredits(String username) {
		final Integer sum = template.queryForObject(
				"SELECT COALESCE(SUM(credits), 0) FROM student_completed_courses WHERE username = :username",
				new MapSqlParameterSource("username", username), Integer.class);
		return sum != null ? sum : 0;
	}

	public BigDecimal avgGrade(String username) {
		final BigDecimal avg = template.queryForObject(
				"SELECT AVG(grade) FROM student_completed_courses WHERE username = :username AND grade IS NOT NULL",
				new MapSqlParameterSource("username", username), BigDecimal.class);
		return avg;
	}

	public record CreditsByCategoryRow(String category, int totalCredits) {
	}

	public List<CreditsByCategoryRow> creditsByCategory(String username) {
		return template.query(
				"SELECT COALESCE(category, 'Uncategorized') AS category, SUM(credits) AS totalCredits FROM student_completed_courses WHERE username = :username GROUP BY category",
				new MapSqlParameterSource("username", username),
				new DataClassRowMapper<>(CreditsByCategoryRow.class));
	}

	public List<Long> getCompletedCourseIds(String username) {
		return template.queryForList("SELECT course_id FROM student_completed_courses WHERE username = :username",
				new MapSqlParameterSource("username", username), Long.class);
	}

	public List<Long> getEnrolledCourseIds(String username) {
		return template.queryForList("SELECT course_id FROM student_enrolled_courses WHERE username = :username",
				new MapSqlParameterSource("username", username), Long.class);
	}
}
