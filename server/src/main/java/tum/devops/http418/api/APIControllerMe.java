package tum.devops.http418.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tum.devops.http418.api.dto.PostRecommendationsBody;
import tum.devops.http418.api.dto.Profile;
import tum.devops.http418.api.dto.ProfileWithOverrides;

import static tum.devops.http418.Http418Application.*;

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
	public ResponseEntity<Profile> getProfile(@AuthenticationPrincipal String tumid) {
		return ResponseEntity.status(HttpStatus.OK)
				.body(restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class));
	}

	@PutMapping("/")
	public ResponseEntity<String> upsertProfile(@RequestBody Profile profile, @AuthenticationPrincipal String tumid) {
		final ResponseEntity<String> entity = restClient.post().uri(PROFILE_SERVICE + "/upsert/" + tumid)
				.contentType(MediaType.APPLICATION_JSON).body(profile).retrieve().toEntity(String.class);
		return ResponseEntity.status(entity.getStatusCode()).body(entity.getBody());
	}

	@GetMapping("/recommendations")
	public ResponseEntity<String> getRecommendations(@AuthenticationPrincipal String tumid) {
		final Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		if (profile == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		return ResponseEntity.status(HttpStatus.OK).body(restClient.post().uri(GENAI_PATH + "/recommendations")
				.contentType(MediaType.APPLICATION_JSON).body(profile).retrieve().body(String.class));
	}

	@PostMapping("/recommendations")
	public ResponseEntity<String> getRecommendations(@AuthenticationPrincipal String tumid,
			@RequestBody PostRecommendationsBody prompt) {
		final Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		if (profile == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		final ProfileWithOverrides newProfile = new ProfileWithOverrides(profile, prompt);
		return ResponseEntity.status(HttpStatus.OK).body(restClient.post().uri(GENAI_PATH + "/recommendations")
				.contentType(MediaType.APPLICATION_JSON).body(newProfile).retrieve().body(String.class));
	}
}
