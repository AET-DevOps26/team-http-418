package tum.devops.http418;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tum.devops.http418.auth.service.AuthService;

@SpringBootTest
@AutoConfigureMockMvc
class MeCoursesEndpointsTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken() {
		try {
			return authService.register("courseuser", "pass").accessToken();
		} catch (Exception e) {
			return authService.login("courseuser", "pass").accessToken();
		}
	}

	@Test
	void completedCoursesCRUD() throws Exception {
		final String token = getToken();
		final String base = "/api/" + API_VERSION + "/me/courses/completed";

		mockMvc.perform(get(base).header("Authorization", "Bearer " + token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.content").isArray()).andExpect(jsonPath("$.totalElements").value(0));

		mockMvc.perform(post(base).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"courseId": 100, "grade": 1.3, "credits": 5, "semester": "25S", "category": "Core"}
						""")).andExpect(status().isCreated()).andExpect(jsonPath("$.courseId").value(100));

		mockMvc.perform(get(base).header("Authorization", "Bearer " + token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.content[0].courseName").value("Introduction to Computer Science"));

		mockMvc.perform(delete(base + "/100").header("Authorization", "Bearer " + token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get(base).header("Authorization", "Bearer " + token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0));
	}

	@Test
	void enrolledCoursesCRUD() throws Exception {
		final String token = getToken();
		final String base = "/api/" + API_VERSION + "/me/courses/enrolled";

		mockMvc.perform(get(base).header("Authorization", "Bearer " + token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(0));

		mockMvc.perform(post(base).header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"courseId": 101, "semester": "25S"}
						""")).andExpect(status().isCreated()).andExpect(jsonPath("$.courseId").value(101));

		mockMvc.perform(get(base).header("Authorization", "Bearer " + token)).andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1));

		mockMvc.perform(delete(base + "/101").header("Authorization", "Bearer " + token))
				.andExpect(status().isNoContent());
	}

	@Test
	void deleteNonexistentReturnsNotFound() throws Exception {
		final String token = getToken();
		mockMvc.perform(delete("/api/" + API_VERSION + "/me/courses/completed/9999").header("Authorization",
				"Bearer " + token)).andExpect(status().isNotFound());
	}
}
