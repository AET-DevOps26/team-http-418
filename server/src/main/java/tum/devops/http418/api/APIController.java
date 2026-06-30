package tum.devops.http418.api;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;

import java.util.List;
import java.util.Optional;

import static tum.devops.http418.Http418Application.GENAI_PATH;
import static tum.devops.http418.Http418Application.restClient;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}")
public class APIController {

	private final CoursesDataDB coursesDataDB;

	@GetMapping("/hello")
	public String sayHello() {
		return "authenticated hello world";
	}

	@GetMapping("/courses")
	public ResponseEntity<List<SimpleCourseData>> getCourses(
			@RequestParam(required = false, defaultValue = "") String query,
			@RequestParam(required = false) String department,
			@RequestParam(required = false) int departmentID,
			@RequestParam(required = false, defaultValue = "en") String language,
			@RequestParam(required = false) String level, //bachelor, master, doctorate, etc
			@RequestParam(required = false, defaultValue = "false") boolean ai,
			@RequestParam(required = false, defaultValue = "0") int page,
			@RequestParam(required = false, defaultValue = "0") int credits_min,
			@RequestParam(required = false, defaultValue = "20", name = "size") int pageSize,
			@RequestParam(required = false, defaultValue = "0") int sort,
			@RequestParam(required = false, defaultValue = "0") int semester,
			@RequestParam(required = false, defaultValue = "0") int credits_max,
			@RequestParam(required = false) String studyProgramId) {

		if (ai) {
			try {
				final List<GenAICourseResponse> aiResponse = restClient.get()
						.uri(uriBuilder -> uriBuilder
								.path(GENAI_PATH + "/v1/courses")
								.queryParamIfPresent("query", Optional.ofNullable(query))
								.queryParam("limit", pageSize)
								.queryParamIfPresent("department", Optional.ofNullable(department))
								.queryParamIfPresent("language", Optional.ofNullable(language))
								.queryParamIfPresent("level", Optional.ofNullable(level))
								.build())
						.retrieve()
						.body(new ParameterizedTypeReference<List<GenAICourseResponse>>() {
						});

				if (aiResponse != null && !aiResponse.isEmpty()) {
					final List<SimpleCourseData> courses = coursesDataDB
							.getByIds(aiResponse.stream().map(GenAICourseResponse::courseId).toList());
					return ResponseEntity.status(HttpStatus.OK).body(courses);
				}
			} catch (Exception e) {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
			}
		}
		final List<SimpleCourseData> courses = coursesDataDB.getByQuery(query, department, departmentID, language,
				level,
				page, credits_min, credits_max, pageSize, sort, semester, studyProgramId);
		return ResponseEntity.status(HttpStatus.OK).body(courses);
	}

	@GetMapping("/courses/{id}")
	public ResponseEntity<DetailedCourseData> getCourseById(@PathVariable int id) {
		try {
			final DetailedCourseData course = coursesDataDB.getById(id);
			return ResponseEntity.status(HttpStatus.OK).body(course);
		} catch (EmptyResultDataAccessException ex) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		}
	}

	@GetMapping("/courses/{id}/prerequisites")
	public ResponseEntity<PrerequisiteTree> getCoursePrerequisites(@PathVariable int id) {
		try {
			final DetailedCourseData course = coursesDataDB.getById(id);
			final PrerequisiteTree tree = new PrerequisiteTree(course.getId(), course.getTitle_en(),
					course.getPrevious_knowledge_en(), course.getPrevious_knowledge_ger());
			return ResponseEntity.ok(tree);
		} catch (EmptyResultDataAccessException ex) {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/departments")
	public ResponseEntity<List<Department>> getDepartments() {
		final List<Department> departments = coursesDataDB.getDepartments().stream()
				.map(row -> new Department(row.id(), row.nameEn())).toList();
		return ResponseEntity.ok(departments);
	}

	@GetMapping("/study-programs")
	public ResponseEntity<List<StudyProgram>> getStudyPrograms() {
		final List<StudyProgram> programs = coursesDataDB.getStudyPrograms().stream()
				.map(row -> new StudyProgram(row.studyId(), row.studyNameEn(), row.studyNameGer())).toList();
		return ResponseEntity.ok(programs);
	}

	@GetMapping("/study-programs/{id}")
	public ResponseEntity<StudyProgram> getStudyProgram(@PathVariable String id) {
		final CoursesDataDB.StudyProgramRow row = coursesDataDB.getStudyProgramById(id);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(new StudyProgram(row.studyId(), row.studyNameEn(), row.studyNameGer()));
	}

	@GetMapping("/study-programs/{id}/courses")
	public ResponseEntity<List<SimpleCourseData>> getStudyProgramCourses(@PathVariable String id) {
		final List<SimpleCourseData> courses = coursesDataDB.getCoursesByStudyProgram(id);
		return ResponseEntity.ok(courses);
	}
}
