package tum.devops.http418.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;
import tum.devops.http418.data.StudentDataDB;

import java.util.*;
import java.util.stream.Collectors;

import static tum.devops.http418.Http418Application.GENAI_PATH;
import static tum.devops.http418.Http418Application.PROFILE_SERVICE;
import static tum.devops.http418.Http418Application.restClient;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}/me/roadmap")
public class APIControllerMeRoadmap {

	private final StudentDataDB studentDataDB;
	private final CoursesDataDB coursesDataDB;
	private final ObjectMapper objectMapper;

	@GetMapping("")
	public ResponseEntity<RoadmapDTO> getRoadmap(@AuthenticationPrincipal String tumid) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.ok(new RoadmapDTO("EMPTY", null, null, List.of()));
		}
		return ResponseEntity.ok(toRoadmapDTO(row));
	}

	@PutMapping("")
	public ResponseEntity<RoadmapDTO> updateRoadmap(@AuthenticationPrincipal String tumid,
			@RequestBody String roadmapJson) {
		studentDataDB.upsertRoadmap(tumid, roadmapJson, "ACTIVE");
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		return ResponseEntity.ok(toRoadmapDTO(row));
	}

	@PostMapping("/generate")
	public ResponseEntity<RoadmapDTO> generateRoadmap(@AuthenticationPrincipal String tumid) {
		try {
			final Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve()
					.body(Profile.class);
			final Profile.Student profileStudent = profile != null ? profile.student() : null;

			final List<StudentDataDB.CompletedCourseRow> completedRows = studentDataDB.getCompletedCourses(tumid, 0,
					1000);
			final List<Long> completedIds = completedRows.stream().map(StudentDataDB.CompletedCourseRow::courseId)
					.toList();
			final Map<Long, CoursesDataDB.CourseDataRow> completedCourseData = coursesDataDB
					.getCourseDataForIds(completedIds).stream()
					.collect(Collectors.toMap(CoursesDataDB.CourseDataRow::id, r -> r, (a, b) -> a));

			final List<Map<String, Object>> completedCourses = completedRows.stream().map(row -> {
				final CoursesDataDB.CourseDataRow cd = completedCourseData.get(row.courseId());
				final Map<String, Object> m = new HashMap<>();
				m.put("courseId", row.courseId());
				m.put("courseCode", cd != null ? cd.key() : String.valueOf(row.courseId()));
				m.put("credits", row.credits());
				m.put("category", row.category());
				m.put("semester", row.semesterKey());
				return m;
			}).toList();

			final List<StudentDataDB.EnrolledCourseRow> enrolledRows = studentDataDB.getEnrolledCourses(tumid, 0,
					1000);
			final List<Long> enrolledIds = enrolledRows.stream().map(StudentDataDB.EnrolledCourseRow::courseId).toList();
			final Map<Long, CoursesDataDB.CourseDataRow> enrolledCourseData = coursesDataDB
					.getCourseDataForIds(enrolledIds).stream()
					.collect(Collectors.toMap(CoursesDataDB.CourseDataRow::id, r -> r, (a, b) -> a));

			final List<Map<String, Object>> enrolledCourses = enrolledRows.stream().map(row -> {
				final CoursesDataDB.CourseDataRow cd = enrolledCourseData.get(row.courseId());
				final Map<String, Object> m = new HashMap<>();
				m.put("courseId", row.courseId());
				m.put("courseCode", cd != null ? cd.key() : String.valueOf(row.courseId()));
				m.put("credits", cd != null ? cd.sws() : 0);
				m.put("semester", row.semesterKey());
				return m;
			}).toList();

			final String studyProgram = profileStudent != null ? profileStudent.studyProgram() : "";
			final Set<Long> usedIds = new HashSet<>(completedIds);
			usedIds.addAll(enrolledIds);
			final List<Map<String, Object>> availableCourses = coursesDataDB
					.getCoursesByStudyProgramWithSws(studyProgram).stream()
					.filter(c -> !usedIds.contains(c.id()))
					.map(c -> {
						final Map<String, Object> m = new HashMap<>();
						m.put("courseId", c.id());
						m.put("courseCode", c.key());
						m.put("courseName", c.title_en() != null ? c.title_en() : String.valueOf(c.id()));
						m.put("credits", c.sws());
						return m;
					}).toList();

			final int totalCreditsEarned = studentDataDB.sumCredits(tumid);
			final int totalCreditsRequired = 180;
			final int remainingSemesters = Math.max(1, (totalCreditsRequired - totalCreditsEarned + 29) / 30);
			final List<Map<String, Object>> categories = studentDataDB.creditsByCategory(tumid).stream().map(row -> {
				final Map<String, Object> m = new HashMap<>();
				m.put("name", row.category());
				m.put("creditsRequired", 60);
				m.put("creditsEarned", row.totalCredits());
				return m;
			}).toList();
			final Map<String, Object> degreeRequirements = new HashMap<>();
			degreeRequirements.put("totalCreditsRequired", totalCreditsRequired);
			degreeRequirements.put("totalCreditsEarned", totalCreditsEarned);
			degreeRequirements.put("remainingSemesters", remainingSemesters);
			degreeRequirements.put("categories", categories);

			final Map<String, Object> preferences = new HashMap<>();
			preferences.put("maxCreditsPerSemester", profileStudent != null ? profileStudent.preferredWorkload() : 30);
			final Map<String, Object> student = new HashMap<>();
			student.put("studyProgram", profileStudent != null ? profileStudent.studyProgram() : "");
			student.put("semester", profileStudent != null ? profileStudent.semester() : 1);
			student.put("careerGoals",
					profileStudent != null && profileStudent.careerGoals() != null
							? List.of(profileStudent.careerGoals())
							: List.of());
			student.put("interests",
					profileStudent != null && profileStudent.interests() != null
							? List.of(profileStudent.interests())
							: List.of());
			student.put("preferences", preferences);

			final Map<String, Object> payload = new HashMap<>();
			payload.put("student", student);
			payload.put("completedCourses", completedCourses);
			payload.put("enrolledCourses", enrolledCourses);
			payload.put("degreeRequirements", degreeRequirements);
			payload.put("availableCourses", availableCourses);

			final String response = restClient.post().uri(GENAI_PATH + "/me/roadmap/generate")
					.contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(String.class);

			final Map<String, Object> genaiResponse = objectMapper.readValue(response,
					new TypeReference<Map<String, Object>>() {
					});
			final String semestersJson = objectMapper.writeValueAsString(genaiResponse.get("semesters"));

			studentDataDB.upsertRoadmap(tumid, semestersJson, "GENERATED");
			final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
			return ResponseEntity.ok(toRoadmapDTO(row));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body(new RoadmapDTO("ERROR", null, null, List.of()));
		}
	}

	@GetMapping("/semesters")
	public ResponseEntity<List<SemesterPlanDetailDTO>> getSemesters(@AuthenticationPrincipal String tumid) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.ok(List.of());
		}
		return ResponseEntity.ok(parseSemesters(row.roadmapJson()));
	}

	@GetMapping("/semesters/{key}")
	public ResponseEntity<SemesterPlanDetailDTO> getSemester(@AuthenticationPrincipal String tumid,
			@PathVariable String key) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		final List<SemesterPlanDetailDTO> semesters = parseSemesters(row.roadmapJson());
		return semesters.stream().filter(s -> key.equals(s.semesterKey())).findFirst()
				.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
	}

	@PutMapping("/semesters/{key}")
	public ResponseEntity<SemesterPlanDetailDTO> updateSemester(@AuthenticationPrincipal String tumid,
			@PathVariable String key, @RequestBody SemesterPlanDetailDTO update) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		final List<SemesterPlanDetailDTO> semesters = new ArrayList<>(parseSemesters(row.roadmapJson()));
		boolean found = false;
		for (int i = 0; i < semesters.size(); i++) {
			if (key.equals(semesters.get(i).semesterKey())) {
				semesters.set(i, update);
				found = true;
				break;
			}
		}
		if (!found) {
			return ResponseEntity.notFound().build();
		}
		saveSemesters(tumid, semesters);
		return ResponseEntity.ok(update);
	}

	@PostMapping("/semesters/{key}/courses")
	public ResponseEntity<SemesterPlanDetailDTO> addCourseToSemester(@AuthenticationPrincipal String tumid,
			@PathVariable String key, @RequestBody AddCourseToSemesterRequest request) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		final List<SemesterPlanDetailDTO> semesters = new ArrayList<>(parseSemesters(row.roadmapJson()));
		for (int i = 0; i < semesters.size(); i++) {
			if (key.equals(semesters.get(i).semesterKey())) {
				final List<PlannedCourseDTO> courses = new ArrayList<>(semesters.get(i).courses());
				courses.add(new PlannedCourseDTO(request.courseId(), request.courseName(), request.credits()));
				final SemesterPlanDetailDTO updated = new SemesterPlanDetailDTO(key, courses);
				semesters.set(i, updated);
				saveSemesters(tumid, semesters);
				return ResponseEntity.status(HttpStatus.CREATED).body(updated);
			}
		}
		return ResponseEntity.notFound().build();
	}

	@DeleteMapping("/semesters/{key}/courses/{courseId}")
	public ResponseEntity<Void> removeCourseFromSemester(@AuthenticationPrincipal String tumid,
			@PathVariable String key, @PathVariable long courseId) {
		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		final List<SemesterPlanDetailDTO> semesters = new ArrayList<>(parseSemesters(row.roadmapJson()));
		for (int i = 0; i < semesters.size(); i++) {
			if (key.equals(semesters.get(i).semesterKey())) {
				final List<PlannedCourseDTO> courses = new ArrayList<>(semesters.get(i).courses());
				courses.removeIf(c -> c.courseId() == courseId);
				semesters.set(i, new SemesterPlanDetailDTO(key, courses));
				saveSemesters(tumid, semesters);
				return ResponseEntity.noContent().build();
			}
		}
		return ResponseEntity.notFound().build();
	}

	private List<SemesterPlanDetailDTO> parseSemesters(String json) {
		try {
			return objectMapper.readValue(json, new TypeReference<List<SemesterPlanDetailDTO>>() {
			});
		} catch (Exception e) {
			return List.of();
		}
	}

	private void saveSemesters(String username, List<SemesterPlanDetailDTO> semesters) {
		try {
			studentDataDB.upsertRoadmap(username, objectMapper.writeValueAsString(semesters), "ACTIVE");
		} catch (Exception e) {
			throw new RuntimeException("Failed to save roadmap", e);
		}
	}

	private RoadmapDTO toRoadmapDTO(StudentDataDB.RoadmapRow row) {
		return new RoadmapDTO(row.status(),
				row.createdAt() != null ? row.createdAt().toString() : null,
				row.updatedAt() != null ? row.updatedAt().toString() : null, parseSemesters(row.roadmapJson()));
	}
}
