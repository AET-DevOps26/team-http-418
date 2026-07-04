package tum.devops.http418;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class Http418Application {

	public static final RestClient restClient = RestClient.create();
	public static final String GENAI_PATH = envOrDefault("GENAI_SERVICE_URL", "http://genai:8000/v1");
	public static final String PROFILE_SERVICE = envOrDefault("PROFILE_SERVICE_URL", "http://user-profile-service:8080/v1");
	public static final String PDF_PARSER_SERVICE = envOrDefault("PDF_PARSER_SERVICE_URL", "http://pdf-parser:8080/v1");

	private static String envOrDefault(String key, String fallback) {
		String val = System.getenv(key);
		return (val != null && !val.isBlank()) ? val : fallback;
	}
	public static void main(String[] args) {
		SpringApplication.run(Http418Application.class, args);
	}
}
