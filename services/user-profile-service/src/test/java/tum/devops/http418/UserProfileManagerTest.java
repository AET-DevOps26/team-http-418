package tum.devops.http418;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
class UserProfileManagerTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;
	@Autowired
	private UserProfileManager userProfileManager;

	@Test
	void testUserProfileActions() throws Exception {
		final String tumId = "ab12cd";
		final Profile.Student student = new Profile.Student(null, null, "master testprogram", 2, List.of("SysAdmin"),
				List.of("AI", "hardware optimization"), 30, 20, 160, null, null, null, null, false);
		final Profile profile = new Profile(student, List.of("IoT"), List.of("ERA"), List.of("EIDI", "PGDP"), 10,
				"Elective",
				"26S");
		userProfileManager.upsert(tumId, profile);
		final Profile updatedProfile = new Profile(student, List.of("IoT"), List.of("DSE"), List.of("EIDI", "PGDP"), 10,
				"Mandatory", "26W");
		userProfileManager.upsert(tumId, updatedProfile);
		assertEquals(userProfileManager.get(tumId), updatedProfile);
	}
}
