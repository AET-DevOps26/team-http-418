package tum.devops.http418;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tum.devops.http418.api.TranscriptService;
import tum.devops.http418.api.dto.Profile;
import tum.devops.http418.auth.service.AuthService;
import tum.devops.http418.data.StudentDataDB;

@SpringBootTest
@AutoConfigureMockMvc
class TranscriptUploadTest extends BaseTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AuthService authService;

	@Autowired
	private StudentDataDB studentDataDB;

	@MockitoBean
	private TranscriptService transcriptService;

	@Value("${API_VERSION}")
	private String API_VERSION;

	private String getToken(String username) {
		try {
			return authService.register(username, "pass").accessToken();
		} catch (Exception e) {
			return authService.login(username, "pass").accessToken();
		}
	}

	private String endpoint() {
		return "/api/" + API_VERSION + "/me/transcript/upload";
	}

	private static final String INTRO_CS_JSON = """
			[{"moduleId":"IN2001","titleEn":"Introduction to Computer Science","titleDe":"Einfuehrung in die Informatik","grade":1.7,"credits":5,"page":1}]
			""";

	private static final Profile CS_PROFILE = new Profile(
			new Profile.Student("Computer Science BSc", 3, new String[] {}, new String[] {}, 20),
			List.of(), List.of(), List.of(), 10, null, null);

	@Test
	void successfulImport() throws Exception {
		final String username = "transcript-ok";
		final String token = getToken(username);
		when(transcriptService.callPdfParser(any())).thenReturn(INTRO_CS_JSON);
		when(transcriptService.fetchProfile(username)).thenReturn(CS_PROFILE);

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.importedCount").value(1))
				.andExpect(jsonPath("$.skippedCount").value(0))
				.andExpect(jsonPath("$.importedCourses[0].courseId").value("100"))
				.andExpect(jsonPath("$.importedCourses[0].courseCode").value("IN2001"))
				.andExpect(jsonPath("$.importedCourses[0].courseName").value("Introduction to Computer Science"));

		final List<StudentDataDB.CompletedCourseRow> rows = studentDataDB.getCompletedCourses(username, 0, 10);
		assertThat(rows).hasSize(1);
		assertThat(rows.get(0).grade()).isEqualByComparingTo("1.7");
		assertThat(rows.get(0).credits()).isEqualTo(5);
		assertThat(rows.get(0).category()).isEqualTo("Pflichtfach");
	}

	@Test
	void duplicateImport() throws Exception {
		final String username = "transcript-dup";
		final String token = getToken(username);
		when(transcriptService.callPdfParser(any())).thenReturn(INTRO_CS_JSON);
		when(transcriptService.fetchProfile(any())).thenReturn(null);

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.importedCount").value(1))
				.andExpect(jsonPath("$.skippedCount").value(0));

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.importedCount").value(0))
				.andExpect(jsonPath("$.skippedCount").value(1))
				.andExpect(jsonPath("$.errors[0]", containsString("IN2001")));

		assertThat(studentDataDB.getCompletedCourses(username, 0, 10)).hasSize(1);
	}

	@Test
	void unmatchedModule() throws Exception {
		final String username = "transcript-unmatched";
		final String token = getToken(username);
		when(transcriptService.callPdfParser(any())).thenReturn("""
				[{"moduleId":"XX999","titleEn":"Unknown Course Title","titleDe":"Unbekannter Kurs","grade":2.0,"credits":3,"page":1}]
				""");
		when(transcriptService.fetchProfile(any())).thenReturn(null);

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.importedCount").value(0))
				.andExpect(jsonPath("$.skippedCount").value(1))
				.andExpect(jsonPath("$.errors[0]", containsString("XX999")));

		assertThat(studentDataDB.getCompletedCourses(username, 0, 10)).isEmpty();
	}

	@Test
	void parserUnavailable() throws Exception {
		final String token = getToken("transcript-503");
		when(transcriptService.callPdfParser(any())).thenThrow(new RuntimeException("Connection refused"));

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isServiceUnavailable());
	}

	@Test
	void invalidParserJson() throws Exception {
		final String token = getToken("transcript-422");
		when(transcriptService.callPdfParser(any())).thenReturn("not-valid-json");

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isUnprocessableEntity());
	}
}
