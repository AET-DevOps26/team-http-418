package tum.devops.http418;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
class Http418ApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void parsePDf() throws Exception {
		ClassPathResource file = new ClassPathResource("grade_report.pdf");
		byte[] fileContent = file.getContentAsByteArray();

		mockMvc.perform(post("/parse-pdf").contentType(MediaType.APPLICATION_OCTET_STREAM).content(fileContent));
		// TODO compare result to expected
	}
}
