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
import java.util.stream.Stream;

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
			return ResponseEntity.ok(new RoadmapDTO("EMPTY", null, null, List.of(), 0, null));
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
				m.put("courseName", cd != null && cd.title_en() != null ? cd.title_en() : String.valueOf(row.courseId()));
				m.put("credits", row.credits());
				m.put("category", row.category());
				m.put("semester", row.semesterKey());
				return m;
			}).toList();

			final String studyProgram = profileStudent != null ? profileStudent.studyProgramId() : "";

			final List<StudentDataDB.EnrolledCourseRow> enrolledRows = studentDataDB.getEnrolledCourses(tumid, 0,
					1000);
			final List<Long> enrolledIds = enrolledRows.stream().map(StudentDataDB.EnrolledCourseRow::courseId)
					.toList();
			final Map<Long, CoursesDataDB.CourseDataRow> enrolledCourseData = coursesDataDB
					.getCourseDataForIds(enrolledIds).stream()
					.collect(Collectors.toMap(CoursesDataDB.CourseDataRow::id, r -> r, (a, b) -> a));

			final Map<Long, Integer> enrolledEcts = coursesDataDB.getEctsForCourses(studyProgram, enrolledIds);
			final List<Map<String, Object>> enrolledCourses = enrolledRows.stream().map(row -> {
				final CoursesDataDB.CourseDataRow cd = enrolledCourseData.get(row.courseId());
				final int sws = cd != null ? cd.sws() : 0;
				final int credits = enrolledEcts.getOrDefault(row.courseId(), (int) Math.round(sws * 1.5));
				final Map<String, Object> m = new HashMap<>();
				m.put("courseId", row.courseId());
				m.put("courseCode", cd != null ? cd.key() : String.valueOf(row.courseId()));
				m.put("credits", credits);
				m.put("semester", row.semesterKey());
				return m;
			}).toList();
			final Set<Long> usedIds = new HashSet<>(completedIds);
			usedIds.addAll(enrolledIds);
			final List<Map<String, Object>> availableCourses = coursesDataDB
					.getCoursesByStudyProgramRich(studyProgram).stream()
					.filter(c -> !usedIds.contains(c.id()))
					.map(c -> {
						final int credits = c.ects() != null ? c.ects() : (int) Math.round(c.sws() * 1.5);
						final Map<String, Object> m = new HashMap<>();
						m.put("courseId", c.id());
						m.put("courseCode", c.key());
						m.put("courseName", c.titleEn() != null ? c.titleEn() : String.valueOf(c.id()));
						m.put("credits", credits);
						m.put("category", c.areaName());
						m.put("preferredSemester", c.semesterKey() != null && c.semesterKey().length() >= 3
								? String.valueOf(Character.toUpperCase(c.semesterKey().charAt(c.semesterKey().length() - 1)))
								: null);
						m.put("hasPrerequisites", c.hasPrerequisites());
						return m;
					}).toList();

			final int totalCreditsEarned = studentDataDB.sumCredits(tumid);
			final Integer programTotalEcts = coursesDataDB.getStudyProgramTotalEcts(studyProgram);
			final int totalCreditsRequired = programTotalEcts != null ? programTotalEcts : 180;
			final int maxCredits = profileStudent != null ? profileStudent.preferredWorkload() : 30;
			final int remainingSemesters = Math.max(1, (totalCreditsRequired - totalCreditsEarned + maxCredits - 1) / maxCredits);

			final Map<String, Integer> earnedByCategory = new HashMap<>();
			for (StudentDataDB.CreditsByCategoryRow row : studentDataDB.creditsByCategory(tumid)) {
				earnedByCategory.put(row.category(), row.totalCredits());
			}
			final List<CoursesDataDB.ProgramRequirementRow> requirementAreas = coursesDataDB.getProgramRequirementAreas(studyProgram);
			final List<Map<String, Object>> categories;
			if (!requirementAreas.isEmpty()) {
				categories = requirementAreas.stream().map(area -> {
					final Map<String, Object> m = new HashMap<>();
					m.put("name", area.areaName());
					m.put("creditsRequired", area.ects() != null ? area.ects() : 0);
					m.put("creditsEarned", earnedByCategory.getOrDefault(area.areaName(), 0));
					return m;
				}).toList();
			} else {
				categories = earnedByCategory.entrySet().stream().map(entry -> {
					final Map<String, Object> m = new HashMap<>();
					m.put("name", entry.getKey());
					m.put("creditsRequired", 60);
					m.put("creditsEarned", entry.getValue());
					return m;
				}).toList();
			}
			final Map<String, Object> degreeRequirements = new HashMap<>();
			degreeRequirements.put("totalCreditsRequired", totalCreditsRequired);
			degreeRequirements.put("totalCreditsEarned", totalCreditsEarned);
			degreeRequirements.put("remainingSemesters", remainingSemesters);
			degreeRequirements.put("categories", categories);

			final Map<String, Object> preferences = new HashMap<>();
			preferences.put("maxCreditsPerSemester", profileStudent != null ? profileStudent.preferredWorkload() : 30);
			final Map<String, Object> student = new HashMap<>();
			student.put("studyProgram", profileStudent != null ? profileStudent.studyProgramId() : "");
			student.put("semester", profileStudent != null ? profileStudent.semester() : 1);
			student.put("careerGoals",
					profileStudent != null && profileStudent.careerGoals() != null
							? profileStudent.careerGoals()
							: List.of());
			student.put("interests",
					profileStudent != null && profileStudent.interests() != null
							? profileStudent.interests()
							: List.of());
			student.put("preferences", preferences);

			final String currentSemesterKey = enrolledRows.isEmpty() ? null
					: enrolledRows.getFirst().semesterKey();
			final Map<String, Object> payload = new HashMap<>();
			payload.put("student", student);
			payload.put("completedCourses", completedCourses);
			payload.put("enrolledCourses", enrolledCourses);
			payload.put("degreeRequirements", degreeRequirements);
			payload.put("availableCourses", availableCourses);
			payload.put("currentSemesterKey", currentSemesterKey != null ? currentSemesterKey : "25W");

			final String response = restClient.post().uri(GENAI_PATH + "/me/roadmap/generate")
					.contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(String.class);

			final Map<String, Object> genaiResponse = objectMapper.readValue(response,
					new TypeReference<Map<String, Object>>() {
					});

			@SuppressWarnings("unchecked")
			final List<Map<String, Object>> rawSemesters = (List<Map<String, Object>>) genaiResponse.get("semesters");
			final List<SemesterPlanDetailDTO> normalizedSemesters = normalizeGenAISemesters(rawSemesters, studyProgram);
			final String normalizedJson = objectMapper.writeValueAsString(normalizedSemesters);

			studentDataDB.upsertRoadmap(tumid, normalizedJson, "GENERATED");
			final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
			return ResponseEntity.ok(toRoadmapDTO(row));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body(new RoadmapDTO("ERROR", null, null, List.of(), 0, null));
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
		final List<CoursesDataDB.CourseDataRow> courseRows = coursesDataDB
				.getCourseDataForIds(List.of(request.courseId()));
		if (courseRows.isEmpty()) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		final CoursesDataDB.CourseDataRow cd = courseRows.get(0);

		final StudentDataDB.RoadmapRow row = studentDataDB.getRoadmap(tumid);
		if (row == null) {
			return ResponseEntity.notFound().build();
		}
		final List<SemesterPlanDetailDTO> semesters = new ArrayList<>(parseSemesters(row.roadmapJson()));
		for (int i = 0; i < semesters.size(); i++) {
			if (key.equals(semesters.get(i).semesterKey())) {
				final SemesterPlanDetailDTO sem = semesters.get(i);
				final List<PlannedCourseDTO> courses = new ArrayList<>(sem.courses());
				final Map<Long, Integer> ects = coursesDataDB.getEctsForCourses(null, List.of(request.courseId()));
				final int credits = ects.getOrDefault(request.courseId(), (int) Math.round(cd.sws() * 1.5));
				final PlannedCourseDTO newCourse = new PlannedCourseDTO(
						request.courseId(), cd.key(),
						cd.title_en() != null ? cd.title_en() : String.valueOf(cd.id()),
						credits, "PLANNED");
				courses.add(newCourse);
				final int newTotalCredits = courses.stream().mapToInt(PlannedCourseDTO::credits).sum();
				final SemesterPlanDetailDTO updated = new SemesterPlanDetailDTO(
						key, sem.label(), newTotalCredits, courses, sem.isCurrent());
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
				final SemesterPlanDetailDTO sem = semesters.get(i);
				final List<PlannedCourseDTO> courses = new ArrayList<>(sem.courses());
				courses.removeIf(c -> c.courseId() == courseId);
				final int newTotalCredits = courses.stream().mapToInt(PlannedCourseDTO::credits).sum();
				semesters.set(i,
						new SemesterPlanDetailDTO(key, sem.label(), newTotalCredits, courses, sem.isCurrent()));
				saveSemesters(tumid, semesters);
				return ResponseEntity.noContent().build();
			}
		}
		return ResponseEntity.notFound().build();
	}

	private List<SemesterPlanDetailDTO> parseSemesters(String json) {
		try {
			final List<Map<String, Object>> rawList = objectMapper.readValue(json,
					new TypeReference<List<Map<String, Object>>>() {
					});
			return rawList.stream().map(s -> {
				final String semKey = (String) s.get("semesterKey");
				String label = s.get("label") instanceof String lbl ? lbl : null;
				if (label == null || label.isEmpty())
					label = deriveLabel(semKey);

				@SuppressWarnings("unchecked")
				final List<Map<String, Object>> rawCourses = s.get("courses") instanceof List<?>
						? (List<Map<String, Object>>) s.get("courses")
						: List.of();
				final List<PlannedCourseDTO> courses = rawCourses.stream().map(c -> {
					final long courseId = c.get("courseId") instanceof Number n ? n.longValue() : 0L;
					final String courseCode = c.get("courseCode") instanceof String cc ? cc : null;
					final String courseName = c.get("courseName") instanceof String cn ? cn : null;
					final int credits = c.get("credits") instanceof Number cr ? cr.intValue() : 0;
					final String status = c.get("status") instanceof String st ? st : null;
					return new PlannedCourseDTO(courseId, courseCode, courseName, credits, status);
				}).toList();

				int totalCredits = s.get("totalCredits") instanceof Number tc ? tc.intValue() : 0;
				if (totalCredits == 0)
					totalCredits = courses.stream().mapToInt(PlannedCourseDTO::credits).sum();

				final boolean isCurrent = Boolean.TRUE.equals(s.get("isCurrent"));
				return new SemesterPlanDetailDTO(semKey, label, totalCredits, courses, isCurrent);
			}).toList();
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
		final List<SemesterPlanDetailDTO> semesters = parseSemesters(row.roadmapJson());
		final int totalPlannedCredits = semesters.stream().mapToInt(SemesterPlanDetailDTO::totalCredits).sum();
		final String estimatedGraduation = semesters.isEmpty()
				? null
				: semesters.get(semesters.size() - 1).semesterKey();
		return new RoadmapDTO(row.status(),
				row.createdAt() != null ? row.createdAt().toString() : null,
				row.updatedAt() != null ? row.updatedAt().toString() : null,
				semesters, totalPlannedCredits, estimatedGraduation);
	}

	private List<SemesterPlanDetailDTO> normalizeGenAISemesters(List<Map<String, Object>> rawSemesters,
			String studyProgram) {
		if (rawSemesters == null)
			return List.of();

		final List<Long> allCourseIds = rawSemesters.stream().flatMap(s -> {
			@SuppressWarnings("unchecked")
			final List<Map<String, Object>> courses = (List<Map<String, Object>>) s.get("courses");
			if (courses == null)
				return Stream.empty();
			return courses.stream()
					.filter(c -> c.get("courseId") instanceof Number)
					.map(c -> ((Number) c.get("courseId")).longValue());
		}).distinct().toList();

		final Map<Long, CoursesDataDB.CourseDataRow> courseMap = coursesDataDB
				.getCourseDataForIds(allCourseIds).stream()
				.collect(Collectors.toMap(CoursesDataDB.CourseDataRow::id, r -> r, (a, b) -> a));
		final Map<Long, Integer> ectsMap = coursesDataDB.getEctsForCourses(studyProgram, allCourseIds);

		return rawSemesters.stream().map(s -> {
			final String semKey = (String) s.get("semesterKey");

			@SuppressWarnings("unchecked")
			final List<Map<String, Object>> rawCourses = s.get("courses") instanceof List<?>
					? (List<Map<String, Object>>) s.get("courses")
					: List.of();

			final List<PlannedCourseDTO> courses = rawCourses.stream().map(rc -> {
				final long courseId = rc.get("courseId") instanceof Number
						? ((Number) rc.get("courseId")).longValue()
						: 0L;
				final CoursesDataDB.CourseDataRow cd = courseMap.get(courseId);
				final String courseCode = cd != null
						? cd.key()
						: (rc.get("courseCode") instanceof String
								? (String) rc.get("courseCode")
								: String.valueOf(courseId));
				final String courseName = cd != null && cd.title_en() != null
						? cd.title_en()
						: String.valueOf(courseId);
				final int sws = cd != null ? cd.sws() : 0;
				final int credits = ectsMap.getOrDefault(courseId, (int) Math.round(sws * 1.5));
				return new PlannedCourseDTO(courseId, courseCode, courseName, credits, "PLANNED");
			}).toList();

			final int totalCredits = courses.stream().mapToInt(PlannedCourseDTO::credits).sum();

			return new SemesterPlanDetailDTO(semKey, deriveLabel(semKey), totalCredits, courses, false);
		}).toList();
	}

	private static String deriveLabel(String semesterKey) {
		if (semesterKey == null || semesterKey.length() < 3) {
			return semesterKey != null ? semesterKey : "";
		}
		try {
			final int year = Integer.parseInt(semesterKey.substring(0, 2));
			final char type = Character.toUpperCase(semesterKey.charAt(semesterKey.length() - 1));
			if (type == 'W')
				return "Winter " + (2000 + year) + "/" + String.format("%02d", (year + 1) % 100);
			if (type == 'S')
				return "Summer " + (2000 + year);
		} catch (NumberFormatException ignored) {
		}
		return semesterKey;
	}
}
