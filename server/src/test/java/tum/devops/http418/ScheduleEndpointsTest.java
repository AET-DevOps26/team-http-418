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
class ScheduleEndpointsTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken() {
		try {
			return authService.register("scheduser", "pass").accessToken();
		} catch (Exception e) {
			return authService.login("scheduser", "pass").accessToken();
		}
	}

	@Test
	void getScheduleReturnsStructure() throws Exception {
		mockMvc.perform(get("/api/" + API_VERSION + "/me/schedule").header("Authorization", "Bearer " + getToken()))
				.andExpect(status().isOk()).andExpect(jsonPath("$.semester").exists())
				.andExpect(jsonPath("$.events").isArray());
	}
}
