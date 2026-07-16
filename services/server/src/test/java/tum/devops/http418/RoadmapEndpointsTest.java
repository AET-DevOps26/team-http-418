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

	private String getToken(String user) {
		try {
			return authService.register(user, "pass").accessToken();
		} catch (Exception e) {
			return authService.login(user, "pass").accessToken();
		}
	}

	@Test
	void getRoadmapEmptyByDefault() throws Exception {
		mockMvc.perform(
				get("/api/" + API_VERSION + "/me/roadmap").header("Authorization",
						"Bearer " + getToken("roadmapuser_empty")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("EMPTY"))
				.andExpect(jsonPath("$.semesters").isArray())
				.andExpect(jsonPath("$.semesters").isEmpty())
				.andExpect(jsonPath("$.totalPlannedCredits").value(0))
				.andExpect(jsonPath("$.estimatedGraduation").doesNotExist());
	}

	@Test
	void putAndGetRoadmap() throws Exception {
		final String token = getToken("roadmapuser_put");
		final String roadmapJson = """
								[{"semesterKey":"25S","label":"Summer 2025","totalCredits":5,"isCurrent":false,\
				"courses":[{"courseId":100,"courseCode":"VO","courseName":"Intro CS","credits":5,"status":"PLANNED"}]}]
								""";

		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("READY"))
				.andExpect(jsonPath("$.totalPlannedCredits").value(5))
				.andExpect(jsonPath("$.estimatedGraduation").value("25S"))
				.andExpect(jsonPath("$.semesters[0].label").value("Summer 2025"))
				.andExpect(jsonPath("$.semesters[0].totalCredits").value(5))
				.andExpect(jsonPath("$.semesters[0].isCurrent").value(false))
				.andExpect(jsonPath("$.semesters[0].courses[0].courseCode").value("VO"))
				.andExpect(jsonPath("$.semesters[0].courses[0].status").value("PLANNED"));

		mockMvc.perform(
				get("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("READY"))
				.andExpect(jsonPath("$.semesters[0].semesterKey").value("25S"))
				.andExpect(jsonPath("$.totalPlannedCredits").value(5))
				.andExpect(jsonPath("$.estimatedGraduation").value("25S"));
	}

	@Test
	void getSemestersReturnsData() throws Exception {
		final String token = getToken("roadmapuser_semesters");
		final String roadmapJson = """
				[{"semesterKey":"25S","label":"Summer 2025","totalCredits":0,"isCurrent":false,"courses":[]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk());

		mockMvc.perform(get("/api/" + API_VERSION + "/me/roadmap/semesters").header("Authorization",
				"Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].semesterKey").value("25S"))
				.andExpect(jsonPath("$[0].label").value("Summer 2025"))
				.andExpect(jsonPath("$[0].totalCredits").value(0))
				.andExpect(jsonPath("$[0].isCurrent").value(false));
	}

	@Test
	void addAndRemoveCourseFromSemester() throws Exception {
		final String token = getToken("roadmapuser_add");
		final String roadmapJson = """
				[{"semesterKey":"25S","label":"Summer 2025","totalCredits":0,"isCurrent":false,"courses":[]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk());

		mockMvc.perform(post("/api/" + API_VERSION + "/me/roadmap/semesters/25S/courses")
				.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"courseId\":100}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.courses[0].courseId").value(100))
				.andExpect(jsonPath("$.courses[0].courseCode").isNotEmpty())
				.andExpect(jsonPath("$.courses[0].courseName").value("Introduction to Computer Science"))
				.andExpect(jsonPath("$.courses[0].credits").value(4))
				.andExpect(jsonPath("$.courses[0].status").value("PLANNED"))
				.andExpect(jsonPath("$.totalCredits").value(4));

		mockMvc.perform(delete("/api/" + API_VERSION + "/me/roadmap/semesters/25S/courses/100")
				.header("Authorization", "Bearer " + token)).andExpect(status().isNoContent());
	}

	@Test
	void addCourseUnknownIdReturns404() throws Exception {
		final String token = getToken("roadmapuser_404");
		final String roadmapJson = """
				[{"semesterKey":"25S","label":"Summer 2025","totalCredits":0,"isCurrent":false,"courses":[]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(roadmapJson)).andExpect(status().isOk());

		mockMvc.perform(post("/api/" + API_VERSION + "/me/roadmap/semesters/25S/courses")
				.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
				.content("{\"courseId\":99999}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void legacySemesterJsonNormalized() throws Exception {
		final String token = getToken("roadmapuser_legacy");
		final String legacyJson = """
				[{"semesterKey":"26W","courses":[{"courseId":101,"courseName":"Software Engineering","credits":3}]}]
				""";
		mockMvc.perform(put("/api/" + API_VERSION + "/me/roadmap").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(legacyJson)).andExpect(status().isOk())
				.andExpect(jsonPath("$.semesters[0].label").value("Winter 2026/27"))
				.andExpect(jsonPath("$.semesters[0].totalCredits").value(3))
				.andExpect(jsonPath("$.estimatedGraduation").value("26W"));
	}
}
