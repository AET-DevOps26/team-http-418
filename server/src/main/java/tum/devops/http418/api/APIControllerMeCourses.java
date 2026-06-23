package tum.devops.http418.api;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/${API_VERSION}/me/courses")
public class APIControllerMeCourses {

	@GetMapping("/completed")
	public ResponseEntity<String> getCompleted() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("/completed")
	public ResponseEntity<String> setCompleted() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@DeleteMapping("/completed")
	public ResponseEntity<String> deleteCompleted() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/enrolled")
	public ResponseEntity<String> getEnrolled() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("/enrolled")
	public ResponseEntity<String> setEnrolled() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@DeleteMapping("/enrolled")
	public ResponseEntity<String> deleteEnrolled() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}
}
