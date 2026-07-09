package tum.devops.http418;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import tum.devops.http418.api.ExternalServices;
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
	private ExternalServices transcriptService;

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

	private String confirmEndpoint() {
		return "/api/" + API_VERSION + "/me/transcript/confirm";
	}

	private String importStateEndpoint() {
		return "/api/" + API_VERSION + "/me/transcript/import-state";
	}

	private static final String INTRO_CS_JSON = """
			[{"moduleId":"IN2001","titleEn":"Introduction to Computer Science","titleDe":"Einfuehrung in die Informatik","grade":1.7,"credits":5,"page":1}]
			""";

	private static final Profile CS_PROFILE = new Profile(
			new Profile.Student(null, null, "4512","Computer Science BSc",3, List.of(), List.of(), 20, 0, 0, null, null,
					null, null, false),
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

		// Courses are pending until confirmed
		assertThat(studentDataDB.getCompletedCourses(username, 0, 10)).isEmpty();
		assertThat(studentDataDB.getImportState(username)).hasSize(1);
		assertThat(studentDataDB.getImportState(username).getFirst().status()).isEqualTo("pending");

		// Confirm import
		mockMvc.perform(post(confirmEndpoint()).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());

		final List<StudentDataDB.CompletedCourseRow> rows = studentDataDB.getCompletedCourses(username, 0, 10);
		assertThat(rows).hasSize(1);
		assertThat(rows.getFirst().grade()).isEqualByComparingTo("1.7");
		assertThat(rows.getFirst().credits()).isEqualTo(5);
		assertThat(rows.getFirst().category()).isEqualTo("Pflichtfach");
	}

	@Test
	void duplicateImport() throws Exception {
		final String username = "transcript-dup";
		final String token = getToken(username);
		when(transcriptService.callPdfParser(any())).thenReturn(INTRO_CS_JSON);
		when(transcriptService.fetchProfile(any())).thenReturn(null);

		// First upload
		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.importedCount").value(1))
				.andExpect(jsonPath("$.skippedCount").value(0));

		// Confirm first import
		mockMvc.perform(post(confirmEndpoint()).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());

		// Second upload of same transcript — course already confirmed, so it's a duplicate
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
		when(transcriptService.callPdfParser(any())).thenReturn(
				"""
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

		// Unmatched course should be in import state
		final List<StudentDataDB.CompletedCourseRow> importRows = studentDataDB.getImportState(username);
		assertThat(importRows).hasSize(1);
		assertThat(importRows.getFirst().status()).isEqualTo("unmatched");
		assertThat(importRows.getFirst().moduleId()).isEqualTo("XX999");
		assertThat(importRows.getFirst().courseId()).isNull();
	}

	@Test
	void importStateReturnsActiveImport() throws Exception {
		final String username = "transcript-state";
		final String token = getToken(username);
		when(transcriptService.callPdfParser(any())).thenReturn(INTRO_CS_JSON);
		when(transcriptService.fetchProfile(any())).thenReturn(CS_PROFILE);

		mockMvc.perform(multipart(endpoint())
				.file(new MockMultipartFile("file", "test.pdf", "application/octet-stream", "pdf".getBytes()))
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());

		mockMvc.perform(get(importStateEndpoint()).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.pending.length()").value(1))
				.andExpect(jsonPath("$.pending[0].courseName").value("Introduction to Computer Science"));
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
