package tum.devops.http418;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.auth.service.AuthService;

@SpringBootTest
@AutoConfigureMockMvc
class AdvisorEndpointsTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Autowired
	private ObjectMapper objectMapper;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken() {
		try {
			return authService.register("advisoruser", "pass").accessToken();
		} catch (Exception e) {
			return authService.login("advisoruser", "pass").accessToken();
		}
	}

	@Test
	void conversationCRUD() throws Exception {
		final String token = getToken();
		final String base = "/api/" + API_VERSION + "/me/advisor";

		mockMvc.perform(get(base + "/conversations").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));

		final MvcResult createResult = mockMvc
				.perform(post(base + "/conversations").header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON).content("{\"title\": \"Test Chat\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("Test Chat")).andReturn();

		final JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
		final String convId = created.get("id").asText();

		mockMvc.perform(get(base + "/conversations/" + convId).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.id").value(convId))
				.andExpect(jsonPath("$.messages").isArray());

		mockMvc.perform(get(base + "/conversations").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
	}

	@Test
	void getConversationNotFound() throws Exception {
		mockMvc.perform(get("/api/" + API_VERSION + "/me/advisor/conversations/nonexistent").header("Authorization",
				"Bearer " + getToken())).andExpect(status().isNotFound());
	}
}
