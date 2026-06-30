package tum.devops.http418;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class Http418Application {

	public static final RestClient restClient = RestClient.create();
	public static final String GENAI_PATH = "http://genai:8000/v1";
	public static final String PROFILE_SERVICE = "http://user-profile-service:8060";
	public static final String PDF_PARSER_SERVICE = "http://pdf-parser:8070";
	public static void main(String[] args) {
		SpringApplication.run(Http418Application.class, args);
	}
}
