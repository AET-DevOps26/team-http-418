package tum.devops.http418.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;
import tum.devops.http418.data.StudentDataDB;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}/me/courses")
public class APIControllerMeCourses {

	private final StudentDataDB studentDataDB;
	private final CoursesDataDB coursesDataDB;

	@GetMapping("/completed")
	public ResponseEntity<PageDTO<CompletedCourseDTO>> getCompleted(@AuthenticationPrincipal String tumid,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		final List<StudentDataDB.CompletedCourseRow> rows = studentDataDB.getCompletedCourses(tumid, page, size);
		final int total = studentDataDB.countCompletedCourses(tumid);
		final List<CompletedCourseDTO> dtos = rows.stream().map(row -> {
			final String name = coursesDataDB.getCourseTitleEn(row.courseId());
			return new CompletedCourseDTO(row.courseId(), String.valueOf(row.courseId()),
					name != null ? name : "Unknown",
					row.grade(), row.credits(), row.semesterKey(), row.category());
		}).toList();
		return ResponseEntity.ok(PageDTO.of(dtos, page, size, total));
	}

	@PostMapping("/completed")
	public ResponseEntity<CompletedCourseDTO> addCompleted(@AuthenticationPrincipal String tumid,
			@RequestBody AddCompletedCourseRequest request) {
		final StudentDataDB.CompletedCourseRow row = studentDataDB.insertCompletedCourse(tumid, request.courseId(),
				request.grade(), request.credits(), request.semester(), request.category());
		if (row == null) {
			return ResponseEntity.status(HttpStatus.CONFLICT).build();
		}
		final String name = coursesDataDB.getCourseTitleEn(row.courseId());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CompletedCourseDTO(row.courseId(), String.valueOf(row.courseId()),
						name != null ? name : "Unknown",
						row.grade(), row.credits(), row.semesterKey(), row.category()));
	}

	@DeleteMapping("/completed/{courseId}")
	public ResponseEntity<Void> deleteCompleted(@AuthenticationPrincipal String tumid, @PathVariable long courseId) {
		final int deleted = studentDataDB.deleteCompletedCourse(tumid, courseId);
		return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
	}

	@GetMapping("/enrolled")
	public ResponseEntity<PageDTO<EnrolledCourseDTO>> getEnrolled(@AuthenticationPrincipal String tumid,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
		final List<StudentDataDB.EnrolledCourseRow> rows = studentDataDB.getEnrolledCourses(tumid, page, size);
		final int total = studentDataDB.countEnrolledCourses(tumid);
		final List<EnrolledCourseDTO> dtos = rows.stream().map(row -> {
			final String name = coursesDataDB.getCourseTitleEn(row.courseId());
			return new EnrolledCourseDTO(row.courseId(), String.valueOf(row.courseId()),
					name != null ? name : "Unknown",
					row.semesterKey());
		}).toList();
		return ResponseEntity.ok(PageDTO.of(dtos, page, size, total));
	}

	@PostMapping("/enrolled")
	public ResponseEntity<EnrolledCourseDTO> addEnrolled(@AuthenticationPrincipal String tumid,
			@RequestBody EnrollCourseRequest request) {
		final StudentDataDB.EnrolledCourseRow row = studentDataDB.insertEnrolledCourse(tumid, request.courseId(),
				request.semester());
		if (row == null) {
			return ResponseEntity.status(HttpStatus.CONFLICT).build();
		}
		final String name = coursesDataDB.getCourseTitleEn(row.courseId());
		return ResponseEntity.status(HttpStatus.CREATED).body(new EnrolledCourseDTO(row.courseId(),
				String.valueOf(row.courseId()), name != null ? name : "Unknown", row.semesterKey()));
	}

	@DeleteMapping("/enrolled/{courseId}")
	public ResponseEntity<Void> deleteEnrolled(@AuthenticationPrincipal String tumid, @PathVariable long courseId) {
		final int deleted = studentDataDB.deleteEnrolledCourse(tumid, courseId);
		return deleted > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
	}
}
