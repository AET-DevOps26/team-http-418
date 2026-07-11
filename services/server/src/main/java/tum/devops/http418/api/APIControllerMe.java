package tum.devops.http418.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;
import tum.devops.http418.data.StudentDataDB;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;


import static tum.devops.http418.Http418Application.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}/me")
public class APIControllerMe {

	private final StudentDataDB studentDataDB;
	private final CoursesDataDB coursesDataDB;
	private final ObjectMapper objectMapper;
	private final ExternalServices transcriptService;
	private final Logger logger = LoggerFactory.getLogger(APIControllerMe.class);

	@GetMapping("/progress")
	public ResponseEntity<AcademicProgressDTO> getProgress(@AuthenticationPrincipal String tumid) {
		final int totalCredits = studentDataDB.sumCredits(tumid);
		final BigDecimal gpa = studentDataDB.avgGrade(tumid);
		final int completed = studentDataDB.countCompletedCourses(tumid);
		final int enrolled = studentDataDB.countEnrolledCourses(tumid);
		final List<AcademicProgressDTO.CreditsByCategory> byCategory = studentDataDB.creditsByCategory(tumid).stream()
				.map(row -> new AcademicProgressDTO.CreditsByCategory(row.category(), row.totalCredits())).toList();
		return ResponseEntity.ok(new AcademicProgressDTO(totalCredits, gpa, completed, enrolled, byCategory));
	}

	@GetMapping("/requirements")
	public ResponseEntity<DegreeRequirementsDTO> getRequirements(@AuthenticationPrincipal String tumid) {
		final int totalCredits = studentDataDB.sumCredits(tumid);
		final List<AcademicProgressDTO.CreditsByCategory> byCategory = studentDataDB.creditsByCategory(tumid).stream()
				.map(row -> new AcademicProgressDTO.CreditsByCategory(row.category(), row.totalCredits())).toList();
		final List<StudentDataDB.CompletedCourseRow> rows = studentDataDB.getCompletedCourses(tumid, 0, 1000);
		final List<CompletedCourseDTO> completedDtos = rows.stream()
				.filter(row -> row.courseId() != null)
				.map(row -> {
					final String name = coursesDataDB.getCourseTitleEn(row.courseId());
					return new CompletedCourseDTO(row.courseId(), String.valueOf(row.courseId()),
							name != null ? name : "Unknown",
							row.grade(), row.credits(), row.semesterKey(), row.category());
				}).toList();
		return ResponseEntity.ok(new DegreeRequirementsDTO(totalCredits, byCategory, completedDtos));
	}

	@PostMapping("/transcript/upload")
	public ResponseEntity<TranscriptImportResultDTO> uploadTranscript(@AuthenticationPrincipal String tumid,
			@RequestParam("file") MultipartFile file) {
		final String parserResponse;
		try {
			parserResponse = transcriptService.callPdfParser(file.getBytes());
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body(new TranscriptImportResultDTO(0, 0, List.of(), List.of("PDF parser unavailable"), List.of()));
		}
		try {
			final List<ParsedModule> modules = objectMapper.readValue(parserResponse,
					new TypeReference<List<ParsedModule>>() {
					});

			studentDataDB.cancelImport(tumid);

			final Profile profile = transcriptService.fetchProfile(tumid);
			final String studyProgramId = (profile != null && profile.student() != null)
					? profile.student().studyProgramId()
					: null;

			final List<TranscriptImportResultDTO.ImportedCourse> importedCourses = new ArrayList<>();
			final List<String> errors = new ArrayList<>();
			final List<ParsedModule> unmatchedModules = new ArrayList<>();
			final List<TranscriptImportResultDTO.UnmatchedModule> finalUnmatchedDTOs = new ArrayList<>();
			int skipped = 0;

			for (final ParsedModule module : modules) {
				final CoursesDataDB.CourseMatchResult course = coursesDataDB.findCourseMatchByTitle(
						normalizeTitle(module.titleEn()), normalizeTitle(module.titleDe()), studyProgramId,
						module.moduleId());
				if (course == null) {
					unmatchedModules.add(module);
					continue;
				}
				final BigDecimal grade = new BigDecimal(String.valueOf(module.grade()))
						.setScale(1, RoundingMode.HALF_UP);
				final String category = course.subjectType() != null ? course.subjectType() : "Uncategorized";
				final String moduleTitle = module.titleEn() != null ? module.titleEn() : module.titleDe();
				final StudentDataDB.CompletedCourseRow inserted = studentDataDB.insertCompletedCourse(
						tumid, Long.parseLong(course.id()), grade, module.credits(), null, category,
						"pending", module.moduleId(), moduleTitle);
				if (inserted == null) {
					skipped++;
					errors.add("Already imported: " + module.moduleId() + " (" + course.title_en() + ")");
				} else {
					final String courseName = course.title_en() != null
							? course.title_en()
							: moduleTitle;
					importedCourses.add(new TranscriptImportResultDTO.ImportedCourse(
							course.id(), module.moduleId(), courseName,
							module.moduleId(), module.titleDe(), module.titleEn(),
							grade.toPlainString(), module.credits()));
				}
			}

			for (final ParsedModule module : unmatchedModules) {
				skipped++;
				final String title = module.titleEn() != null ? module.titleEn() : module.titleDe();
				errors.add("No catalog match for " + module.moduleId() + ": " + title);
				final BigDecimal gradeVal = new BigDecimal(String.valueOf(module.grade()))
						.setScale(1, RoundingMode.HALF_UP);
				studentDataDB.insertCompletedCourse(
						tumid, null, gradeVal, module.credits(), null, null,
						"unmatched", module.moduleId(), title);
				finalUnmatchedDTOs.add(new TranscriptImportResultDTO.UnmatchedModule(
						module.moduleId(), module.titleDe(), module.titleEn(),
						gradeVal.toPlainString(), module.credits()));
			}

			return ResponseEntity
					.ok(new TranscriptImportResultDTO(importedCourses.size(), skipped, importedCourses, errors,
							finalUnmatchedDTOs));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
					.body(new TranscriptImportResultDTO(0, 0, List.of(),
							List.of("Failed to parse transcript response: " + e.getMessage()), List.of()));
		}
	}

	@PostMapping("/transcript/ai-match")
	public ResponseEntity<AiMatchResponseDTO> aiMatchTranscript(@AuthenticationPrincipal String tumid,
			@RequestBody AiMatchRequestDTO request) {
		if (request.modules() == null || request.modules().isEmpty()) {
			return ResponseEntity.ok(new AiMatchResponseDTO(List.of(), List.of()));
		}
		try {
			final List<Map<String, String>> aiModules = new ArrayList<>();
			for (final AiMatchRequestDTO.Module m : request.modules()) {
				final Map<String, String> entry = new HashMap<>();
				entry.put("module_id", m.moduleId());
				entry.put("title_en", m.titleEn());
				entry.put("title_de", m.titleDe());
				aiModules.add(entry);
			}
			final String aiResponse = transcriptService.callTranscriptMatch(Map.of("modules", aiModules));
			final Map<String, Object> aiResult = objectMapper.readValue(aiResponse, new TypeReference<>() {
			});
			@SuppressWarnings("unchecked")
			final List<Map<String, Object>> aiMatches = (List<Map<String, Object>>) aiResult.get("matches");
			final List<AiMatchResponseDTO.Match> matches = new ArrayList<>();
			final Set<String> matchedIds = new HashSet<>();
			if (aiMatches != null) {
				for (final Map<String, Object> match : aiMatches) {
					final String moduleId = (String) match.get("module_id");
					final long courseId = ((Number) match.get("course_id")).longValue();
					if (moduleId == null) continue;
					matchedIds.add(moduleId);
					final CoursesDataDB.CourseInfo info = coursesDataDB.getCourseInfo(courseId);
					final String courseName = info != null ? info.titleEn() : null;
					final String courseCode = info != null ? info.key() : String.valueOf(courseId);
					final double score = match.get("score") instanceof Number n ? n.doubleValue() : 1.0;
					matches.add(new AiMatchResponseDTO.Match(moduleId, String.valueOf(courseId),
							courseCode, courseName != null ? courseName : courseCode, score));
				}
			}
			final List<String> unmatched = request.modules().stream()
					.map(AiMatchRequestDTO.Module::moduleId)
					.filter(id -> !matchedIds.contains(id))
					.toList();
			return ResponseEntity.ok(new AiMatchResponseDTO(matches, unmatched));
		} catch (Exception e) {
			logger.warn("AI match failed: {}", e.getMessage());
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
		}
	}

	@GetMapping("/transcript/import-state")
	public ResponseEntity<ImportStateDTO> getImportState(@AuthenticationPrincipal String tumid) {
		final List<StudentDataDB.CompletedCourseRow> rows = studentDataDB.getImportState(tumid);
		final List<ImportStateDTO.ImportRow> pending = new ArrayList<>();
		final List<ImportStateDTO.ImportRow> unmatched = new ArrayList<>();
		final List<ImportStateDTO.ImportRow> skipped = new ArrayList<>();
		for (final StudentDataDB.CompletedCourseRow row : rows) {
			final String courseName = row.courseId() != null ? coursesDataDB.getCourseTitleEn(row.courseId()) : null;
			final ImportStateDTO.ImportRow importRow = new ImportStateDTO.ImportRow(
					row.id(), row.courseId(), courseName, row.moduleId(), row.moduleTitle(),
					row.grade(), row.credits(), row.category(), row.status());
			switch (row.status()) {
				case "pending" -> pending.add(importRow);
				case "unmatched" -> unmatched.add(importRow);
				case "skipped" -> skipped.add(importRow);
			}
		}
		return ResponseEntity.ok(new ImportStateDTO(!rows.isEmpty(), pending, unmatched, skipped));
	}

	@PostMapping("/transcript/confirm")
	public ResponseEntity<Void> confirmImport(@AuthenticationPrincipal String tumid) {
		studentDataDB.confirmImport(tumid);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/transcript/cancel")
	public ResponseEntity<Void> cancelImport(@AuthenticationPrincipal String tumid) {
		studentDataDB.cancelImport(tumid);
		return ResponseEntity.ok().build();
	}

	@PutMapping("/transcript/import/{id}/resolve")
	public ResponseEntity<Void> resolveImportCourse(@AuthenticationPrincipal String tumid,
			@PathVariable long id, @RequestBody ResolveImportRequest request) {
		final int updated = studentDataDB.resolveUnmatched(id, tumid, request.courseId(), request.category());
		return updated > 0 ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
	}

	@PutMapping("/transcript/import/{id}/skip")
	public ResponseEntity<Void> skipImportCourse(@AuthenticationPrincipal String tumid, @PathVariable long id) {
		final int updated = studentDataDB.skipUnmatched(id, tumid);
		return updated > 0 ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
	}

	@PutMapping("/transcript/import/{id}/unskip")
	public ResponseEntity<Void> unskipImportCourse(@AuthenticationPrincipal String tumid, @PathVariable long id) {
		final int updated = studentDataDB.unskipCourse(id, tumid);
		return updated > 0 ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
	}

	@PutMapping("/transcript/import/{id}/unresolve")
	public ResponseEntity<Void> unresolveImportCourse(@AuthenticationPrincipal String tumid, @PathVariable long id) {
		final int updated = studentDataDB.unresolve(id, tumid);
		return updated > 0 ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
	}

	@PutMapping("/transcript/import/{id}/grade")
	public ResponseEntity<Void> updateImportGrade(@AuthenticationPrincipal String tumid,
			@PathVariable long id, @RequestBody Map<String, BigDecimal> body) {
		final BigDecimal grade = body.get("grade");
		if (grade == null) return ResponseEntity.badRequest().build();
		final int updated = studentDataDB.updateImportCourseGrade(id, tumid, grade);
		return updated > 0 ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
	}

	private static String normalizeTitle(String s) {
		if (s == null)
			return "";
		return s.trim().replaceAll("\\s+", " ").toLowerCase();
	}

	@GetMapping("")
	public ResponseEntity<Profile> getProfile(@AuthenticationPrincipal String tumid) {
		try {
			Profile profile = restClient.get()
					.uri(PROFILE_SERVICE + "/get/" + tumid)
					.retrieve()
					.body(Profile.class);
			return ResponseEntity.ok(profile);

		} catch (RestClientResponseException e) {
			logger.debug("Error fetching profile: {} {}", e.getStatusCode(), e.getMessage());
			return ResponseEntity.status(e.getStatusCode()).build();
		}
	}

	@PostMapping("")
	public ResponseEntity<String> upsertProfile(@RequestBody Profile profile, @AuthenticationPrincipal String tumid) {
		final ResponseEntity<String> entity = restClient.post().uri(PROFILE_SERVICE + "/upsert/" + tumid)
				.contentType(MediaType.APPLICATION_JSON).body(profile).retrieve().toEntity(String.class);
		return ResponseEntity.status(entity.getStatusCode()).body(entity.getBody());
	}

	@GetMapping("/recommendations")
	public ResponseEntity<String> getRecommendations(@AuthenticationPrincipal String tumid) {
		return getRecommendations(tumid, new PostRecommendationsBody(List.of(), List.of(), List.of()));
	}

	@PostMapping("/recommendations")
	public ResponseEntity<String> getRecommendations(@AuthenticationPrincipal String tumid,
			@RequestBody PostRecommendationsBody prompt) {
		final Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve()
				.body(Profile.class);
		if (profile == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		final ProfileWithOverrides newProfile = new ProfileWithOverrides(profile, prompt);
		return ResponseEntity.status(HttpStatus.OK).body(restClient.post().uri(GENAI_PATH + "/me/recommendations")
				.contentType(MediaType.APPLICATION_JSON).body(newProfile).retrieve().body(String.class));
	}

	@GetMapping("/schedule")
	public ResponseEntity<WeeklyScheduleDTO> getSchedule(@AuthenticationPrincipal String tumid,
			@RequestParam(required = false) String semester) {
		final List<StudentDataDB.EnrolledCourseRow> enrolledRows = studentDataDB.getEnrolledCourses(tumid, 0, 100)
				.stream()
				.filter(row -> semester == null || semester.equals(row.semesterKey()))
				.toList();
		final List<ScheduleEventDTO> events = new ArrayList<>();

		for (final StudentDataDB.EnrolledCourseRow row : enrolledRows) {
			final String name = coursesDataDB.getCourseTitleEn(row.courseId());
			final List<Appointment> appointments = coursesDataDB.getAppointments((int) row.courseId());
			for (final Appointment apt : appointments) {
				events.add(new ScheduleEventDTO(row.courseId(), name != null ? name : "Unknown", apt.weekday_key(),
						apt.time_from(), apt.time_to(), apt.place()));
			}
		}

		return ResponseEntity
				.ok(new WeeklyScheduleDTO(semester != null ? semester : "current", events));
	}
}
