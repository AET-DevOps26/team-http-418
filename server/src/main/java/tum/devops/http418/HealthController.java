package tum.devops.http418;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
	Logger logger = LoggerFactory.getLogger(APIController.class);

	@GetMapping("/health")
	public String sayHello() {
		logger.info("healthy");
		return "healthy";
	}
}
