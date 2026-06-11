package tum.devops.http418;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
public class APIController {

	@GetMapping("/health")
	public ResponseEntity<String> health() {
		return ResponseEntity.status(HttpStatus.OK).body("healthy");
	}

	@PostMapping("/parse-pdf")
	public ResponseEntity<String> parse(@RequestBody byte[] fileContent) {
		String res = PDFParser.parsePDF(fileContent);
		return ResponseEntity.status(res.equals("OK") ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR).body(res);
	}

	@ExceptionHandler(IOException.class)
	public ResponseEntity<String> handleException(IOException ex) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
	}
}
