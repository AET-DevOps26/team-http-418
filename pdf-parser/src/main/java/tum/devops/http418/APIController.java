package tum.devops.http418;

import org.jspecify.annotations.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/v1")
public class APIController {

	final ObjectMapper objectMapper = new ObjectMapper();
	final Logger logger = LoggerFactory.getLogger(APIController.class);

	@GetMapping("/health")
	public ResponseEntity<String> health() {
		logger.info("healthy");
		return ResponseEntity.status(HttpStatus.OK).body("healthy");
	}

	/**
	 * @param fileContent pdf file as bytes
	 * @return json representation of parsed fields
	 */
	@PostMapping("/parse-pdf")
	public ResponseEntity<String> parse(@RequestBody byte[] fileContent) {
		Optional<List<PDFParser.Module>> res = PDFParser.parsePDF(fileContent);
		if (res.isEmpty()) {
			return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body("Could not parse PDF");
		}
		return ResponseEntity.status(HttpStatus.OK).body(objectMapper.writeValueAsString(res.get()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> handleException(@NonNull Exception ex) {
		logger.error("Error parsing PDF", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
	}
}
