package tum.devops.http418;

import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.EmptyResultDataAccessException;

@RestController
@RequestMapping("/v1")
public class APIController {

	APIController(UserProfileManager userProfileManager) {
		this.userProfileManager = userProfileManager;
	}

	final Logger logger = LoggerFactory.getLogger(APIController.class);
	final UserProfileManager userProfileManager;

	@GetMapping("/health")
	public ResponseEntity<String> health() {
		logger.info("healthy");
		return ResponseEntity.status(HttpStatus.OK).body("healthy");
	}

	@GetMapping("/get/{id}")
	public ResponseEntity<Profile> getProfile(@PathVariable String id) {
		try {
			return ResponseEntity.status(HttpStatus.OK).body(userProfileManager.get(id));
		} catch (EmptyResultDataAccessException ex) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	@PostMapping("/upsert/{id}")
	public ResponseEntity<String> updateProfile(@RequestBody Profile profile, @PathVariable String id) {
		userProfileManager.upsert(id, profile);
		return ResponseEntity.status(HttpStatus.OK).build();
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> handleException(@NonNull Exception ex) {
		logger.error("Error handling request", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
	}
}
