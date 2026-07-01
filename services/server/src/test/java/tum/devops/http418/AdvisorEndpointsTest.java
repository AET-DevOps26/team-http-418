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

	private String getToken(String username) {
		try {
			return authService.register(username, "pass").accessToken();
		} catch (Exception e) {
			return authService.login(username, "pass").accessToken();
		}
	}

	private String getToken() {
		return getToken("advisoruser");
	}

	@Test
	void conversationCRUD() throws Exception {
		final String token = getToken("advisor_crud_user");
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

	@Test
	void sendMessageToNonExistentConversation() throws Exception {
		mockMvc.perform(post("/api/" + API_VERSION + "/me/advisor/conversations/nonexistent/messages")
				.header("Authorization", "Bearer " + getToken())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\": \"hello\"}"))
				.andExpect(status().isNotFound());
	}

	//	@Test
	//	void createConversationWithEmptyTitle() throws Exception {
	//		mockMvc.perform(post("/api/" + API_VERSION + "/me/advisor/conversations")
	//				.header("Authorization", "Bearer " + getToken())
	//				.contentType(MediaType.APPLICATION_JSON)
	//				.content("{\"title\": \"\"}"))
	//				.andExpect(status().isBadRequest());
	//	}

	//	@Test
	//	void createConversationWithNullTitle() throws Exception {
	//		mockMvc.perform(post("/api/" + API_VERSION + "/me/advisor/conversations")
	//				.header("Authorization", "Bearer " + getToken())
	//				.contentType(MediaType.APPLICATION_JSON)
	//				.content("{\"title\": null}"))
	//				.andExpect(status().isBadRequest());
	//	}

	@Test
	void createConversationWithNoBody() throws Exception {
		mockMvc.perform(post("/api/" + API_VERSION + "/me/advisor/conversations")
				.header("Authorization", "Bearer " + getToken())
				.contentType(MediaType.APPLICATION_JSON))
				.andExpect(status().isBadRequest());
	}

	@Test
	void sendMessageWithBlankContent() throws Exception {
		final String token = getToken("advisor_blank_user");
		final String base = "/api/" + API_VERSION + "/me/advisor";

		final MvcResult createResult = mockMvc
				.perform(post(base + "/conversations").header("Authorization", "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON).content("{\"title\": \"Blank Test\"}"))
				.andExpect(status().isCreated()).andReturn();

		final JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
		final String convId = created.get("id").asText();

		mockMvc.perform(post(base + "/conversations/" + convId + "/messages")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\": \"\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void crossUserAccessDenied() throws Exception {
		final String tokenA = getToken("advisor_user_a");
		final String tokenB = getToken("advisor_user_b");
		final String base = "/api/" + API_VERSION + "/me/advisor";

		final MvcResult createResult = mockMvc
				.perform(post(base + "/conversations").header("Authorization", "Bearer " + tokenA)
						.contentType(MediaType.APPLICATION_JSON).content("{\"title\": \"Private Chat\"}"))
				.andExpect(status().isCreated()).andReturn();

		final JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
		final String convId = created.get("id").asText();

		mockMvc.perform(get(base + "/conversations/" + convId).header("Authorization", "Bearer " + tokenB))
				.andExpect(status().isNotFound());
	}
}
