package tum.devops.http418.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/${API_VERSION}/me")
public class APIControllerMe {

	@GetMapping("/progress")
	public ResponseEntity<String> getProgress() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/requirements")
	public ResponseEntity<String> getRequirements() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("/transcript/upload")
	public ResponseEntity<Boolean> uploadTranscript() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("/")
	public ResponseEntity<String> getProfile() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PutMapping("/")
	public ResponseEntity<String> updateProfile() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@GetMapping("recommendations")
	public ResponseEntity<String> getRecommendations() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("recommendations")
	public ResponseEntity<String> getRecommendations(String prompt) {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}
}
