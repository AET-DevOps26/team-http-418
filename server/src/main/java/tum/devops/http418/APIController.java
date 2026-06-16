package tum.devops.http418;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/${API_VERSION}")
public class APIController {

	@GetMapping("/hello")
	public String sayHello() {
		return "authenticated hello world";
	}
}
