package tum.devops.http418;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tum.devops.http418.auth.service.AuthService;

@SpringBootTest
@AutoConfigureMockMvc
class CatalogEndpointsTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken() {
		try {
			return authService.register("cataloguser", "pass").accessToken();
		} catch (Exception e) {
			return authService.login("cataloguser", "pass").accessToken();
		}
	}

	@Test
	void getDepartmentsReturnsData() throws Exception {
		mockMvc.perform(get("/api/" + API_VERSION + "/departments").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getStudyProgramsReturnsData() throws Exception {
		mockMvc.perform(get("/api/" + API_VERSION + "/study-programs").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getStudyProgramByIdReturnsData() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/study-programs/522").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$.id").value("522"))
				.andExpect(jsonPath("$.nameEn").value("Computer Science BSc"));
	}

	@Test
	void getStudyProgramByIdNotFound() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/study-programs/999").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isNotFound());
	}

	@Test
	void getStudyProgramCoursesReturnsData() throws Exception {
		mockMvc.perform(get("/api/" + API_VERSION + "/study-programs/522/courses").header("Authorization",
				"Bearer " + getToken())).andExpect(status().isOk()).andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getCoursePrerequisitesReturnsData() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/courses/100/prerequisites").header("Authorization",
						"Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$.courseId").value(100));
	}

	@Test
	void getCoursePrerequisitesNotFound() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/courses/99999/prerequisites").header("Authorization",
						"Bearer " + getToken()))
				.andExpect(status().isNotFound());
	}
}
