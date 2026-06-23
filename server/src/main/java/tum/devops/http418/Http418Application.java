package tum.devops.http418;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.client.RestClient;

@SpringBootApplication
public class Http418Application {

	public static final RestClient restClient = RestClient.create();

	public static void main(String[] args) {
		SpringApplication.run(Http418Application.class, args);
	}
}
