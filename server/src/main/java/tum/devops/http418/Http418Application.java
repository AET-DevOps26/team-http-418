package tum.devops.http418;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Http418Application {
	final public static String API_VERSION = "v1";
	public static void main(String[] args) {
		SpringApplication.run(Http418Application.class, args);
	}
}
