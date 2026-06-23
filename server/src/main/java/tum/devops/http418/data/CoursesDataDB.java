package tum.devops.http418.data;

import lombok.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import tum.devops.http418.api.dto.*;

import java.util.ArrayList;
import java.util.List;

@Repository
public class CoursesDataDB {

	public CoursesDataDB(@Qualifier("coursesJdbcTemplate") NamedParameterJdbcTemplate template) {
		this.template = template;
	}

	private final NamedParameterJdbcTemplate template;

	public List<SimpleCourseData> getByIds(List<String> ids) {
		final String query = "SELECT * FROM courses WHERE id IN (:ids)";
		final MapSqlParameterSource parameters = new MapSqlParameterSource("ids", ids);
		return template.query(query, parameters, new BeanPropertyRowMapper<>(SimpleCourseData.class));
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
				ctype.name as course_type,
				sem.semester_key as semester_key,
				org.name_ger as org_name_ger,
				org.name_en as org_name_en,
				org.org_page_url as org_url

				FROM courses c
				JOIN organizations org ON c.organization_id = org.id
				JOIN semesters sem ON c.semester_id = sem.id
				JOIN curriculum_connections cc ON cc.course_id = c.id
				JOIN (
					Select * from lectureship
					JOIN persons ON persons.id = lectureship.person_id
				 ) as lectureXperson ON lectureXperson.course_id = c.id
				JOIN course_appointments app on app.course_id = c.id
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
		//        JOIN curriculum_connections ON curriculum_connections.course_id = courses.id
		//        JOIN (
		//                Select * from lectureship
		//                JOIN persons ON persons.id = lectureship.person_id
		//        ) as lectureXperson ON lectureXperson.course_id = courses.id
	}

	private @NonNull List<CurriculumConnections> getCurriculumConnections(int id) {
		return new ArrayList<>(); //TODO
	}

	private @NonNull List<Person> getPeople(int id) {
		return new ArrayList<>(); //TODO
	}

	public @NonNull List<Appointment> getAppointments(int course_id) {
		return new ArrayList<>(); //TODO
	}

	public List<SimpleCourseData> getByQuery(String query,
			String department,
			int departmentID,
			String language, //TODO we have no info about language
			String level, //bachelor, master, doctorate, etc
			int page,
			int credits_min, //TODO we have no info about credit count
			int credits_max, //TODO we have no info about credit count
			int size,
			int sort,
			int semester,
			String studyProgramId) {
		final StringBuilder sqlQuery = new StringBuilder("SELECT * FROM courses");

		if ((department != null && !department.isBlank()) || departmentID != 0) { //TODO remove condition if its information is used in result anyways
			sqlQuery.append(" JOIN organizations ON courses.organization_id = organizations.id");
		}
		if (semester != 0) { //TODO remove condition if its information is used in result anyways
			sqlQuery.append(" JOIN semesters ON courses.semester_id = semesters.id");
		}
		if (studyProgramId != null && !studyProgramId.isBlank()) { // this is expensive, so we only do it if we need it
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
					AND (title_ger ILIKE %:query%
					OR title_en ILIKE %:query%
					OR description_ger ILIKE %:query%
					OR description_en ILIKE %:query%)
					""");
			params.addValue("query", query.trim());
		}

		if (!department.isBlank()) {
			sqlQuery.append("""
					AND organization.name_ger ILIKE %:department%
					OR organization.name_en ILIKE %:department%
					"""); // Assuming department maps to organization_id
			params.addValue("department", department);
		}

		if (departmentID != 0) {
			sqlQuery.append("""
					AND organization.id ILIKE %:department%
					"""); // Assuming department maps to organization_id
			params.addValue("department", departmentID);
		}

		if (!studyProgramId.isBlank()) {
			sqlQuery.append("""
					AND curriculum_connections.study_program_id ILIKE %:studyProgramId%
					""");
			params.addValue("studyProgramId", studyProgramId);
		}

		if (!level.isBlank()) {
			sqlQuery.append("""
					AND curriculum_connections.path @@ ('$[*].name like_regex ' || :levelRegex || ' flag "i"')::jsonpath
					""");
			params.addValue("levelRegex", ".*" + level.trim() + ".*");
		}

		// 6. Sorting
		switch (sort) {
			case 1 -> sqlQuery.append(" ORDER BY title_en ASC");
			case 2 -> sqlQuery.append(" ORDER BY title_en DESC");
			case 3 -> sqlQuery.append(" ORDER BY created_at DESC");
			default -> sqlQuery.append(" ORDER BY id ASC"); // Default fallback sorting
		}

		// 7. Pagination (Limit & Offset)
		final int pageSize = (size > 0) ? size : 20;
		final int offset = Math.max(0, page - 1) * pageSize;

		sqlQuery.append(" LIMIT :limit OFFSET :offset");
		params.addValue("limit", pageSize);
		params.addValue("offset", offset);
		return template.query(sqlQuery.toString(), new BeanPropertyRowMapper<>(SimpleCourseData.class));
	}
}
