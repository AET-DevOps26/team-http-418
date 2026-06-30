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
import tum.devops.http418.data.StudentDataDB;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static tum.devops.http418.Http418Application.GENAI_PATH;
import static tum.devops.http418.Http418Application.restClient;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}/me/roadmap")
public class APIControllerMeRoadmap {

	private final StudentDataDB studentDataDB;
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
			final List<Long> completedIds = studentDataDB.getCompletedCourseIds(tumid);
			final List<Long> enrolledIds = studentDataDB.getEnrolledCourseIds(tumid);
			final Map<String, Object> payload = Map.of("username", tumid, "completedCourseIds", completedIds,
					"enrolledCourseIds", enrolledIds);

			final String response = restClient.post().uri(GENAI_PATH + "/me/roadmap/generate")
					.contentType(MediaType.APPLICATION_JSON).body(payload).retrieve().body(String.class);

			studentDataDB.upsertRoadmap(tumid, response, "GENERATED");
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
