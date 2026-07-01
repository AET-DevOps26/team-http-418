package tum.devops.http418.data;

import jakarta.annotation.Nullable;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import tum.devops.http418.api.dto.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Repository
public class CoursesDataDB {

	public CoursesDataDB(@Qualifier("coursesJdbcTemplate") NamedParameterJdbcTemplate template) {
		this.template = template;
	}

	private final NamedParameterJdbcTemplate template;

	public List<SimpleCourseData> getByIds(List<String> ids) {
		final String query = """
				SELECT c.id, c.title_ger, c.title_en, ct."key" FROM courses c JOIN course_types ct on c.course_type_id = ct.id WHERE c.id IN (:ids)""";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("ids", ids);
		final List<SimpleCourseData> courses = template.query(query, parameters,
				new DataClassRowMapper<>(SimpleCourseData.class));

		// preserve the order of the IDs in the original list
		// Map each ID to its original index for O(1) lookup speed during sorting
		final Map<String, Integer> idOrderMap = IntStream.range(0, ids.size())
				.boxed()
				.collect(Collectors.toMap(ids::get, index -> index));

		// Sort the results based on the original index map
		courses.sort(Comparator.comparingInt(course -> idOrderMap.getOrDefault(course.id(), Integer.MAX_VALUE)));
		return courses;
	}

	public DetailedCourseData getById(int id) {
		final String query = """
				SELECT
				c.id,
				c.title_ger,
				c.title_en,
				c.sws,
				c.description_ger,
				c.description_en,
				c.previous_knowledge_ger,
				c.previous_knowledge_en,
				c.course_objective_ger,
				c.course_objective_en,
				c.teaching_method_ger,
				c.teaching_method_en,
				c.registration_info,
				ctype."name" as course_type,
				sem.semester_key as semester_key,
				org.name_ger as org_name_ger,
				org.name_en as org_name_en,
				org.org_page_url as org_url
				FROM courses c
				JOIN organizations org ON c.organization_id = org.id
				JOIN semesters sem ON c.semester_id = sem.id
				JOIN course_types ctype on ctype.id = c.course_type_id
				WHERE c.id = :id
				""";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("id", id);
		final DetailedCourseData course = template.queryForObject(query, parameters,
				new BeanPropertyRowMapper<>(DetailedCourseData.class));

		course.setAppointments(getAppointments(id));
		course.setPeople(getPeople(id));
		course.setCurriculumConnections(getCurriculumConnections(id));
		return course;
	}

	private @NonNull List<CurriculumConnections> getCurriculumConnections(int id) {
		final String query = """
				SELECT * FROM curriculum_connections WHERE course_id = :id
				""";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("id", id);
		return template.query(query, parameters, new DataClassRowMapper<>(CurriculumConnections.class));
	}

	private @NonNull List<Person> getPeople(int id) {
		final String query = """
				SELECT p.first_name, p.last_name, ls.teaching_function FROM persons p
				    JOIN lectureship ls on ls.person_id = p.id
				         WHERE ls.course_id = :id
				""";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("id", id);
		return template.query(query, parameters, new DataClassRowMapper<>(Person.class));
	}

	public @NonNull List<Appointment> getAppointments(int course_id) {
		final String query = """
				SELECT app.weekday_key, app.time_from, app.time_to, app.place, app.is_series FROM course_appointments app
				WHERE course_id = :id
				""";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("id", course_id);
		return template.query(query, parameters, new DataClassRowMapper<>(Appointment.class));
	}

	public record DepartmentRow(long id, String nameEn) {
	}

	public List<DepartmentRow> getDepartments() {
		return template.query(
				"SELECT DISTINCT o.id, o.name_en AS nameEn FROM organizations o WHERE o.name_en IS NOT NULL ORDER BY o.name_en",
				new DataClassRowMapper<>(DepartmentRow.class));
	}

	public record StudyProgramRow(String studyId, String studyNameEn, String studyNameGer) {
	}

	public List<StudyProgramRow> getStudyPrograms() {
		return template.query(
				"SELECT DISTINCT study_id AS studyId, study_name_en AS studyNameEn, study_name_ger AS studyNameGer FROM curriculum_connections WHERE study_name_en IS NOT NULL ORDER BY study_name_en",
				new DataClassRowMapper<>(StudyProgramRow.class));
	}

	public StudyProgramRow getStudyProgramById(String id) {
		final List<StudyProgramRow> rows = template.query(
				"SELECT DISTINCT study_id AS studyId, study_name_en AS studyNameEn, study_name_ger AS studyNameGer FROM curriculum_connections WHERE study_id = :id LIMIT 1",
				new MapSqlParameterSource("id", id), new DataClassRowMapper<>(StudyProgramRow.class));
		return rows.isEmpty() ? null : rows.getFirst();
	}

	public List<SimpleCourseData> getCoursesByStudyProgram(String studyId) {
		return template.query("""
				SELECT c.id, c.title_ger, c.title_en, ct."key" FROM courses c \
				JOIN course_types ct ON c.course_type_id = ct.id \
				JOIN curriculum_connections cc ON cc.course_id = c.id \
				WHERE cc.study_id = :studyId ORDER BY c.title_en""",
				new MapSqlParameterSource("studyId", studyId), new DataClassRowMapper<>(SimpleCourseData.class));
	}

	public record CourseMatchResult(String id, String title_ger, String title_en, String key, String subjectType) {
	}

	public @Nullable CourseMatchResult findCourseMatchByTitle(String normalizedTitleEn, String normalizedTitleDe,
			String studyProgram) {
		return findCourseMatchByTitle(normalizedTitleEn, normalizedTitleDe, studyProgram, null);
	}

	public @Nullable CourseMatchResult findCourseMatchByTitle(String normalizedTitleEn, String normalizedTitleDe,
			String studyProgram, @Nullable String moduleId) {
		final StringBuilder sql = new StringBuilder("""
				SELECT c.id, c.title_ger, c.title_en, ct."key", cc.subject_type AS subjectType
				FROM courses c
				JOIN course_types ct ON c.course_type_id = ct.id
				LEFT JOIN curriculum_connections cc ON cc.course_id = c.id
				WHERE (LOWER(TRIM(c.title_en)) = :titleEn
				   OR LOWER(TRIM(c.title_ger)) = :titleDe
				   OR c.title_en ILIKE :titleEnPrefix
				   OR c.title_ger ILIKE :titleDePrefix""");
		final MapSqlParameterSource params = new MapSqlParameterSource()
				.addValue("titleEn", normalizedTitleEn)
				.addValue("titleDe", normalizedTitleDe)
				.addValue("titleEnPrefix", normalizedTitleEn + " (%")
				.addValue("titleDePrefix", normalizedTitleDe + " (%")
				.addValue("studyProgram", studyProgram);
		if (moduleId != null && !moduleId.isBlank()) {
			sql.append(" OR c.title_en ILIKE :modulePattern OR c.title_ger ILIKE :modulePattern");
			params.addValue("modulePattern", "%(" + moduleId + ")%");
		}
		sql.append("""
				)
				ORDER BY
				    CASE WHEN LOWER(TRIM(c.title_en)) = :titleEn OR LOWER(TRIM(c.title_ger)) = :titleDe THEN 0
				         WHEN c.title_en ILIKE :titleEnPrefix OR c.title_ger ILIKE :titleDePrefix THEN 1
				         ELSE 2 END,
				    CASE WHEN cc.study_id = :studyProgram
				              OR cc.study_name_en = :studyProgram
				              OR cc.study_name_ger = :studyProgram
				         THEN 0 ELSE 1 END,
				    c.id ASC
				LIMIT 1
				""");
		final List<CourseMatchResult> results = template.query(sql.toString(), params,
				new DataClassRowMapper<>(CourseMatchResult.class));
		return results.isEmpty() ? null : results.getFirst();
	}

	public record CourseDataRow(long id, String title_en, String key, int sws) {
	}

	public List<CourseDataRow> getCourseDataForIds(List<Long> ids) {
		if (ids.isEmpty())
			return List.of();
		final String query = """
				SELECT c.id, c.title_en, ct."key", COALESCE(c.sws, 0) AS sws \
				FROM courses c JOIN course_types ct ON c.course_type_id = ct.id \
				WHERE c.id IN (:ids)""";
		final MapSqlParameterSource params = new MapSqlParameterSource("ids", ids);
		final List<CourseDataRow> courses = template.query(query, params,
				new DataClassRowMapper<>(CourseDataRow.class));
		final Map<Long, Integer> idOrderMap = IntStream.range(0, ids.size())
				.boxed()
				.collect(Collectors.toMap(ids::get, index -> index, (a, b) -> a));
		courses.sort(Comparator.comparingInt(c -> idOrderMap.getOrDefault(c.id(), Integer.MAX_VALUE)));
		return courses;
	}

	public List<CourseDataRow> getCoursesByStudyProgramWithSws(String studyId) {
		if (studyId == null || studyId.isBlank())
			return List.of();
		return template.query("""
				SELECT c.id, c.title_en, ct."key", COALESCE(c.sws, 0) AS sws FROM courses c \
				JOIN course_types ct ON c.course_type_id = ct.id \
				JOIN curriculum_connections cc ON cc.course_id = c.id \
				WHERE cc.study_id = :studyId ORDER BY c.title_en""",
				new MapSqlParameterSource("studyId", studyId), new DataClassRowMapper<>(CourseDataRow.class));
	}

	public String getCourseTitleEn(long courseId) {
		final List<String> titles = template.queryForList("SELECT title_en FROM courses WHERE id = :id",
				new MapSqlParameterSource("id", courseId), String.class);
		return titles.isEmpty() ? null : titles.getFirst();
	}

	public record CourseNameRow(long id, String titleEn) {
	}

	public List<CourseNameRow> getAllCourseNames() {
		return template.query(
				"SELECT id, title_en AS titleEn FROM courses WHERE title_en IS NOT NULL ORDER BY id",
				new DataClassRowMapper<>(CourseNameRow.class));
	}

	public List<SimpleCourseData> getByQuery(String query,
			@Nullable String department,
			int departmentID,
			@Nullable String language, //TODO we have no info about language
			@Nullable String level, //bachelor, master, doctorate, etc
			int page,
			int credits_min, //TODO we have no info about credit count
			int credits_max, //TODO we have no info about credit count
			int size,
			int sort,
			int semester,
			@Nullable String studyProgramId) {
		final StringBuilder sqlQuery = new StringBuilder("SELECT courses.id, courses.title_ger, courses.title_en, ct.\"key\" FROM courses JOIN course_types ct ON courses.course_type_id = ct.id");

		if ((department != null && !department.isBlank()) || departmentID != 0) { //TODO remove condition if its information is used in result anyways
			sqlQuery.append(" JOIN organizations ON courses.organization_id = organizations.id");
		}
		if (semester != 0) { //TODO remove condition if its information is used in result anyways
			sqlQuery.append(" JOIN semesters ON courses.semester_id = semesters.id");
		}
		if ((studyProgramId != null && !studyProgramId.isBlank()) || (level != null && !level.isBlank())) { // this is expensive, so we only do it if we need it
			sqlQuery.append(" JOIN curriculum_connections ON curriculum_connections.course_id = courses.id");
		}
		sqlQuery.append(" WHERE 1=1");
		final MapSqlParameterSource params = new MapSqlParameterSource();

		if (semester != 0) {
			sqlQuery.append(" AND semesters.id = :semester");
			params.addValue("semester", semester);
		}
		// 1. Text Search (Matches title or description in EN/GER)
		if (query != null && !query.trim().isEmpty()) {
			sqlQuery.append("""
					AND (courses.title_ger ILIKE :query
					OR courses.title_en ILIKE :query
					OR courses.description_ger ILIKE :query
					OR courses.description_en ILIKE :query)
					""");
			params.addValue("query", "%" + query.trim() + "%");
		}

		if (department != null && !department.isBlank()) {
			sqlQuery.append("""
					AND (organizations.name_ger ILIKE :department
					OR organizations.name_en ILIKE :department)
					""");
			params.addValue("department", "%" + department + "%");
		}

		if (departmentID != 0) {
			sqlQuery.append("""
					AND organizations.id = :departmentid
					""");
			params.addValue("departmentid", departmentID);
		}

		if (studyProgramId != null && !studyProgramId.isBlank()) {
			sqlQuery.append("""
					AND curriculum_connections.study_id = :studyProgramId
					""");
			params.addValue("studyProgramId", studyProgramId);
		}

		if (level != null && !level.isBlank()) {
			sqlQuery.append("""
					AND curriculum_connections.path @@ ('$[*].name like_regex ' || :levelRegex || ' flag "i"')::jsonpath
					""");
			params.addValue("levelRegex", ".*" + level.trim() + ".*");
		}

		// 6. Sorting
		switch (sort) {
			case 1 -> sqlQuery.append(" ORDER BY courses.title_en ASC");
			case 2 -> sqlQuery.append(" ORDER BY courses.title_en DESC");
			case 3 -> sqlQuery.append(" ORDER BY courses.created_at DESC");
			default -> sqlQuery.append(" ORDER BY courses.id ASC");
		}

		// 7. Pagination (Limit & Offset)
		final int pageSize = (size > 0) ? size : 20;
		final int offset = Math.max(0, page - 1) * pageSize;

		sqlQuery.append(" LIMIT :limit OFFSET :offset");
		params.addValue("limit", pageSize);
		params.addValue("offset", offset);
		return template.query(sqlQuery.toString(), params, new DataClassRowMapper<>(SimpleCourseData.class));
	}
}
