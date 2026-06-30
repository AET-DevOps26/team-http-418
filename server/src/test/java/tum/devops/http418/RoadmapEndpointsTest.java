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
class RoadmapEndpointsTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken() {
		try {
			return authService.register("roadmapuser", "pass").accessToken();
		} catch (Exception e) {
			return authService.login("roadmapuser", "pass").accessToken();
		}
	}

	@Test
	void getRoadmapEmptyByDefault() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EMPTY"));
	}

	@Test
	void putAndGetRoadmap() throws Exception {
		final String token = getToken();
		final String roadmapJson = """
				[{"semesterKey":"25S","courses":[{"courseId":100,"courseName":"Intro CS","credits":5}]}]
				""";

		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ACTIVE"));

		mockMvc.perform(
				get("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"))
				.andExpect(jsonPath("$.semesters[0].semesterKey").value("25S"));
	}

	@Test
	void getSemestersReturnsData() throws Exception {
		final String token = getToken();
		final String roadmapJson = """
				[{"semesterKey":"25S","courses":[]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk());

		mockMvc.perform(get("/api/" + API_VERSION + "/me/roadmap/semesters").header("Authorization",
				"Bearer " + token)).andExpect(status().isOk()).andExpect(jsonPath("$[0].semesterKey").value("25S"));
	}

	@Test
	void addAndRemoveCourseFromSemester() throws Exception {
		final String token = getToken();
		final String roadmapJson = """
				[{"semesterKey":"25S","courses":[]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk());

		mockMvc.perform(post("/api/" + API_VERSION + "/me/roadmap/semesters/25S/courses")
				.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"courseId\":100,\"courseName\":\"Intro CS\",\"credits\":5}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.courses[0].courseId").value(100));

		mockMvc.perform(delete("/api/" + API_VERSION + "/me/roadmap/semesters/25S/courses/100")
				.header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
	}
}
