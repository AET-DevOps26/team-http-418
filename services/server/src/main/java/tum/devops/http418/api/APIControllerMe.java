package tum.devops.http418.api;

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
		final List<CompletedCourseDTO> completedDtos = rows.stream().map(row -> {
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

			final Profile profile = transcriptService.fetchProfile(tumid);
			final String studyProgram = (profile != null && profile.student() != null)
					? profile.student().studyProgram()
					: null;

			final List<TranscriptImportResultDTO.ImportedCourse> importedCourses = new ArrayList<>();
			final List<String> errors = new ArrayList<>();
			final List<ParsedModule> unmatchedModules = new ArrayList<>();
			final List<TranscriptImportResultDTO.UnmatchedModule> finalUnmatchedDTOs = new ArrayList<>();
			int skipped = 0;

			for (final ParsedModule module : modules) {
				final CoursesDataDB.CourseMatchResult course = coursesDataDB.findCourseMatchByTitle(
						normalizeTitle(module.titleEn()), normalizeTitle(module.titleDe()), studyProgram,
						module.moduleId());
				if (course == null) {
					unmatchedModules.add(module);
					continue;
				}
				final BigDecimal grade = new BigDecimal(String.valueOf(module.grade()))
						.setScale(1, RoundingMode.HALF_UP);
				final String category = course.subjectType() != null ? course.subjectType() : "Uncategorized";
				final StudentDataDB.CompletedCourseRow inserted = studentDataDB.insertCompletedCourse(
						tumid, Long.parseLong(course.id()), grade, module.credits(), null, category);
				if (inserted == null) {
					skipped++;
					errors.add("Already imported: " + module.moduleId() + " (" + course.title_en() + ")");
				} else {
					final String courseName = course.title_en() != null
							? course.title_en()
							: (module.titleEn() != null ? module.titleEn() : module.titleDe());
					importedCourses.add(new TranscriptImportResultDTO.ImportedCourse(
							course.id(), module.moduleId(), courseName,
							module.moduleId(), module.titleDe(), module.titleEn(),
							grade.toPlainString(), module.credits()));
				}
			}

			if (!unmatchedModules.isEmpty() && transcriptService.isTranscriptAiEnabled()) {
				try {
					final List<Map<String, String>> aiModules = new ArrayList<>();
					for (final ParsedModule m : unmatchedModules) {
						final Map<String, String> entry = new HashMap<>();
						entry.put("module_id", m.moduleId());
						entry.put("title_en", m.titleEn());
						entry.put("title_de", m.titleDe());
						aiModules.add(entry);
					}
					final String aiBody = objectMapper.writeValueAsString(Map.of("modules", aiModules));
					final String aiResponse = transcriptService.callTranscriptMatch(aiBody);
					final Map<String, Object> aiResult = objectMapper.readValue(aiResponse, new TypeReference<>() {
					});
					@SuppressWarnings("unchecked")
					final List<Map<String, Object>> aiMatches = (List<Map<String, Object>>) aiResult.get("matches");
					final Set<String> aiMatchedIds = new HashSet<>();
					if (aiMatches != null) {
						for (final Map<String, Object> match : aiMatches) {
							final String moduleId = (String) match.get("module_id");
							final long courseId = ((Number) match.get("course_id")).longValue();
							final ParsedModule module = unmatchedModules.stream()
									.filter(m -> moduleId != null && moduleId.equals(m.moduleId()))
									.findFirst().orElse(null);
							if (module == null)
								continue;
							final BigDecimal grade = new BigDecimal(String.valueOf(module.grade()))
									.setScale(1, RoundingMode.HALF_UP);
							final StudentDataDB.CompletedCourseRow inserted = studentDataDB.insertCompletedCourse(
									tumid, courseId, grade, module.credits(), null, "Uncategorized");
							if (inserted == null) {
								skipped++;
								errors.add("Already imported: " + moduleId);
							} else {
								final String courseName = coursesDataDB.getCourseTitleEn(courseId);
								importedCourses.add(new TranscriptImportResultDTO.ImportedCourse(
										String.valueOf(courseId), moduleId,
										courseName != null ? courseName : moduleId,
										moduleId, module.titleDe(), module.titleEn(),
										grade.toPlainString(), module.credits()));
								aiMatchedIds.add(moduleId);
							}
						}
					}
					for (final ParsedModule module : unmatchedModules) {
						if (!aiMatchedIds.contains(module.moduleId())) {
							skipped++;
							final String title = module.titleEn() != null ? module.titleEn() : module.titleDe();
							errors.add("No catalog match for " + module.moduleId() + ": " + title);
							final BigDecimal gradeVal = new BigDecimal(String.valueOf(module.grade()))
									.setScale(1, RoundingMode.HALF_UP);
							finalUnmatchedDTOs.add(new TranscriptImportResultDTO.UnmatchedModule(
									module.moduleId(), module.titleDe(), module.titleEn(),
									gradeVal.toPlainString(), module.credits()));
						}
					}
				} catch (Exception e) {
					for (final ParsedModule module : unmatchedModules) {
						skipped++;
						final String title = module.titleEn() != null ? module.titleEn() : module.titleDe();
						errors.add("No catalog match for " + module.moduleId() + ": " + title);
						final BigDecimal gradeVal = new BigDecimal(String.valueOf(module.grade()))
								.setScale(1, RoundingMode.HALF_UP);
						finalUnmatchedDTOs.add(new TranscriptImportResultDTO.UnmatchedModule(
								module.moduleId(), module.titleDe(), module.titleEn(),
								gradeVal.toPlainString(), module.credits()));
					}
				}
			} else {
				for (final ParsedModule module : unmatchedModules) {
					skipped++;
					final String title = module.titleEn() != null ? module.titleEn() : module.titleDe();
					errors.add("No catalog match for " + module.moduleId() + ": " + title);
					final BigDecimal gradeVal = new BigDecimal(String.valueOf(module.grade()))
							.setScale(1, RoundingMode.HALF_UP);
					finalUnmatchedDTOs.add(new TranscriptImportResultDTO.UnmatchedModule(
							module.moduleId(), module.titleDe(), module.titleEn(),
							gradeVal.toPlainString(), module.credits()));
				}
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

	private static String normalizeTitle(String s) {
		if (s == null)
			return "";
		return s.trim().replaceAll("\\s+", " ").toLowerCase();
	}

	@GetMapping("")
	public ResponseEntity<Profile> getProfile(@AuthenticationPrincipal String tumid) {
		try {
			return restClient.get()
					.uri(PROFILE_SERVICE + "/get/" + tumid)
					.retrieve()
					.toEntity(Profile.class);
		} catch (RestClientResponseException e) {
			return ResponseEntity.status(e.getStatusCode()).build();
		}
	}

	@PutMapping("")
	public ResponseEntity<String> upsertProfile(@RequestBody Profile profile, @AuthenticationPrincipal String tumid) {
		final ResponseEntity<String> entity = restClient.post().uri(PROFILE_SERVICE + "/upsert/" + tumid)
				.contentType(MediaType.APPLICATION_JSON).body(profile).retrieve().toEntity(String.class);
		return ResponseEntity.status(entity.getStatusCode()).body(entity.getBody());
	}

	@GetMapping("/recommendations")
	public ResponseEntity<String> getRecommendations(@AuthenticationPrincipal String tumid) {
		final Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve()
				.body(Profile.class);
		if (profile == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		return ResponseEntity.status(HttpStatus.OK).body(restClient.post().uri(GENAI_PATH + "/me/recommendations")
				.contentType(MediaType.APPLICATION_JSON).body(profile).retrieve().body(String.class));
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

	@GetMapping("/dashboard")
	public ResponseEntity<DashboardDTO> getDashboard(@AuthenticationPrincipal String tumid) {
		final int totalCredits = studentDataDB.sumCredits(tumid);
		final BigDecimal gpa = studentDataDB.avgGrade(tumid);
		final int completed = studentDataDB.countCompletedCourses(tumid);
		final int enrolled = studentDataDB.countEnrolledCourses(tumid);
		final DashboardDTO.DashboardProgress progress = new DashboardDTO.DashboardProgress(totalCredits, gpa, completed,
				enrolled);

		final List<StudentDataDB.EnrolledCourseRow> enrolledRows = studentDataDB.getEnrolledCourses(tumid, 0, 10);
		final List<EnrolledCourseDTO> upcoming = enrolledRows.stream().map(row -> {
			final String name = coursesDataDB.getCourseTitleEn(row.courseId());
			return new EnrolledCourseDTO(row.courseId(), String.valueOf(row.courseId()),
					name != null ? name : "Unknown",
					row.semesterKey());
		}).toList();

		return ResponseEntity.ok(new DashboardDTO(progress, upcoming, List.of(), List.of()));
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
