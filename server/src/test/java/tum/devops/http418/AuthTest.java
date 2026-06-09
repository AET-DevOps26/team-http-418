package tum.devops.http418;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.auth.dto.AuthResponse;
import tum.devops.http418.auth.dto.RefreshRequest;
import tum.devops.http418.auth.service.DBUserDetailsManager;

@SpringBootTest
@AutoConfigureMockMvc
class AuthLifecycleTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private DBUserDetailsManager userDetailsManager;

	private static final String PROTECTED_ENDPOINT = "/api/hello";

	/**
	 * test that: 1. protected endpoint is not accessible without login 2. register
	 * works 3. logout works 4. login works 5. refresh token works 6. logout works
	 * 7. refresh token is invalidated after logout
	 *
	 */
	@Test
	void authLifecycleWorks() throws Exception {

		mockMvc.perform(get(PROTECTED_ENDPOINT)).andExpect(status().isUnauthorized());

		String loginJson = """
				{
				  "tumId": "testid",
				  "password": "testpass"
				}
				""";

		if (userDetailsManager.userExists("testid"))
			userDetailsManager.deleteUser("testid");

		String registerResponseJson = mockMvc
				.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(loginJson))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		AuthResponse registerResponse = objectMapper.readValue(registerResponseJson, AuthResponse.class);

		assertThat(registerResponse.accessToken()).isNotBlank();
		assertThat(registerResponse.refreshToken()).isNotBlank();
		assertThat(registerResponse.expiresIn()).isEqualTo(3600);

		mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(loginJson))
				.andExpect(status().isConflict());

		mockMvc.perform(post("/auth/logout").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(new RefreshRequest(registerResponse.refreshToken()))))
				.andExpect(status().isNoContent());

		String loginResponseJson = mockMvc
				.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginJson))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		AuthResponse loginResponse = objectMapper.readValue(loginResponseJson, AuthResponse.class);

		assertThat(loginResponse.accessToken()).isNotBlank();
		assertThat(loginResponse.refreshToken()).isNotBlank();
		assertThat(loginResponse.expiresIn()).isEqualTo(3600);

		mockMvc.perform(get(PROTECTED_ENDPOINT).header("Authorization", "Bearer " + loginResponse.accessToken()))
				.andExpect(status().isOk());

		RefreshRequest refreshRequest = new RefreshRequest(loginResponse.refreshToken());

		String refreshResponseJson = mockMvc
				.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(refreshRequest)))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		AuthResponse refreshResponse = objectMapper.readValue(refreshResponseJson, AuthResponse.class);

		assertThat(refreshResponse.accessToken()).isNotBlank();
		assertThat(refreshResponse.refreshToken()).isNotBlank();
		assertThat(refreshResponse.refreshToken()).isNotEqualTo(loginResponse.refreshToken());

		mockMvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(refreshRequest))).andExpect(status().isUnauthorized());

		mockMvc.perform(get(PROTECTED_ENDPOINT).header("Authorization", "Bearer " + refreshResponse.accessToken()))
				.andExpect(status().isOk());

		mockMvc.perform(post("/auth/logout").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(new RefreshRequest(refreshResponse.refreshToken()))))
				.andExpect(status().isNoContent());

		mockMvc.perform(post("/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(new RefreshRequest(refreshResponse.refreshToken()))))
				.andExpect(status().isUnauthorized());
	}
}
