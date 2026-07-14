package tum.devops.http418.api;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;
import tum.devops.http418.data.StudentDataDB;

import java.util.*;

import static tum.devops.http418.Http418Application.GENAI_PATH;
import static tum.devops.http418.Http418Application.restClient;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}")
public class APIController {

	private final CoursesDataDB coursesDataDB;
	private final StudentDataDB studentDataDB;
	private final Logger logger = LoggerFactory.getLogger(APIController.class);

	@GetMapping("/hello")
	public String sayHello() {
		return "authenticated hello world";
	}

	@GetMapping("/courses")
	public ResponseEntity<List<SimpleCourseData>> getCourses(
			@RequestParam(required = false, defaultValue = "") String query,
			@RequestParam(required = false) String department,
			@RequestParam(required = false) Integer departmentID,
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
				final List<GenAICourseResponse> aiResponse = restClient.get() //TODO this does not work
						.uri(uriBuilder -> uriBuilder
								.path(GENAI_PATH + "/courses")
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
				logger.error(e.getMessage());
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
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
			return ResponseEntity.ok(buildPrerequisiteTree(id));
		} catch (EmptyResultDataAccessException ex) {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping("/courses/{id}/prerequisites/check")
	public ResponseEntity<PrerequisiteCheck> checkCoursePrerequisites(@PathVariable int id,
			@AuthenticationPrincipal String tumid) {
		try {
			final PrerequisiteTree tree = buildPrerequisiteTree(id);
			final Set<Long> completedIds = new HashSet<>(studentDataDB.getCompletedCourseIds(tumid));

			final List<PrerequisiteCheck.PrerequisiteCheckRef> metPrereqs = new ArrayList<>();
			final List<PrerequisiteCheck.PrerequisiteCheckRef> unmetPrereqs = new ArrayList<>();

			for (PrerequisiteTree.PrerequisiteNode node : flattenPrerequisiteNodes(tree.prerequisites())) {
				final PrerequisiteCheck.PrerequisiteCheckRef ref = new PrerequisiteCheck.PrerequisiteCheckRef(
						node.courseId(), node.courseCode(), node.courseName(), node.type());
				if (completedIds.contains(node.courseId())) {
					metPrereqs.add(ref);
				} else {
					unmetPrereqs.add(ref);
				}
			}

			final boolean eligible = unmetPrereqs.stream().noneMatch(r -> "REQUIRED".equals(r.type()));
			return ResponseEntity.ok(new PrerequisiteCheck(tree.courseId(), tree.courseCode(), eligible,
					unmetPrereqs, metPrereqs));
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

	private PrerequisiteTree buildPrerequisiteTree(int id) {
		final DetailedCourseData course = coursesDataDB.getById(id);
		final String code = String.valueOf(course.getId());

		if (course.getPrevious_knowledge_en() == null || course.getPrevious_knowledge_en().isBlank()) {
			return new PrerequisiteTree(course.getId(), code, course.getTitle_en(), List.of());
		}

		final List<Map<String, Object>> availableCourses = coursesDataDB.getAllCourseNames().stream()
				.map(row -> {
					final Map<String, Object> m = new HashMap<>();
					m.put("courseId", row.id());
					m.put("courseName", row.titleEn());
					return m;
				})
				.toList();

		final Map<String, Object> payload = new HashMap<>();
		payload.put("courseId", (long) course.getId());
		payload.put("courseName", course.getTitle_en());
		payload.put("previousKnowledgeText", course.getPrevious_knowledge_en());
		payload.put("availableCourses", availableCourses);

		try {
			final PrerequisiteTree tree = restClient.post()
					.uri(GENAI_PATH + "/prerequisites/extract")
					.contentType(MediaType.APPLICATION_JSON)
					.body(payload)
					.retrieve()
					.body(PrerequisiteTree.class);
			return tree != null ? tree : new PrerequisiteTree(course.getId(), code, course.getTitle_en(), List.of());
		} catch (Exception e) {
			return new PrerequisiteTree(course.getId(), code, course.getTitle_en(), List.of());
		}
	}

	public static List<PrerequisiteTree.PrerequisiteNode> flattenPrerequisiteNodes(
			List<PrerequisiteTree.PrerequisiteNode> nodes) {
		final List<PrerequisiteTree.PrerequisiteNode> result = new ArrayList<>();
		for (PrerequisiteTree.PrerequisiteNode node : nodes) {
			result.add(node);
			if (node.prerequisites() != null && !node.prerequisites().isEmpty()) {
				result.addAll(flattenPrerequisiteNodes(node.prerequisites()));
			}
		}
		return result;
	}
}
