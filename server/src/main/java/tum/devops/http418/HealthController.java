package tum.devops.http418;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
	final Logger logger = LoggerFactory.getLogger(HealthController.class);

	@GetMapping("/health")
	public String getHealth() {
		logger.debug("healthy");
		return "healthy";
	}
}
