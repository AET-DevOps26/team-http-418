package tum.devops.http418;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Http418ApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	void testParsePDf() throws Exception {
		final ClassPathResource file = new ClassPathResource("grade_report.pdf");
		final byte[] fileContent = file.getContentAsByteArray();

		final String response = mockMvc
				.perform(post("/v1/parse-pdf").contentType(MediaType.APPLICATION_OCTET_STREAM).content(fileContent))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		final List<PDFParser.Module> returnedObjects = objectMapper.readValue(response, new TypeReference<>() {
		});

		final List<PDFParser.Module> expected = List.of(
				new PDFParser.Module("IN0012", "Bachelor-Praktikum", "Bachelor Practical Course", 1.0f, 10, 1, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0001", "Einführung in die Informatik", "Introduction to Informatics", 2.0f, 6,
						1, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0002", "Grundlagenpraktikum: Programmierung",
						"Fundamentals of Programming (Exercises & Laboratory)", 2.3f, 6, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0006", "Einführung in die Softwaretechnik",
						"Introduction to Software Engineering", 2.3f, 6, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0008", "Grundlagen: Datenbanken", "Fundamentals of Databases", 3.0f, 6, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0007", "Grundlagen: Algorithmen und Datenstrukturen",
						"Fundamentals of Algorithms and Data Structures", 3.3f, 6, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0021", "Einführung in die Wirtschaftsinformatik",
						"Introduction to Information Systems", 3.0f, 5, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0025", "Informationstechnologien und Gesellschaft (IT und Gesellschaft)",
						"Information Technologies and Society (IT and Society)", 2.3f, 5, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN2258", "Middleware und verteilte Systeme", "Middleware and Distributed Systems",
						1.0f, 5, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0024", "Operations Research", "Operations Research", 3.7f, 6, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN2085", "Software Engineering für betriebliche Anwendungen - Bachelorkurs",
						"Software Engineering for Business Applications - Bachelor's Course", 2.7f, 5, 2, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("WI000261", "Empirical Research Methods", "Empirical Research Methods", 2.3f, 6,
						3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("WI001059", "Buchführung und Rechnungswesen", "Financial Accounting and Reporting",
						3.3f, 6, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("WI001057_E", "Cost Accounting", "Cost Accounting", 4.0f, 6, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module(
						"MA0901", "Lineare Algebra für Informatik", "Linear Algebra for Informatics", 2.0f, 8, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0015", "Diskrete Strukturen", "Discrete Structures", 3.7f, 8, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module(
						"MA9712", "Statistik für BWL", "Statistics for Business Administration", 3.3f, 6, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN2288", "Event Processing", "Event Processing", 2.3f, 5, 3, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("IN0003", "Funktionale Programmierung und Verifikation",
						"Functional Programming and Verification", 3.0f, 5, 4, null, false, PDFParser.GradeType.NUMERIC),
				new PDFParser.Module("POL25104", "Datenschutzrecht", "Data Protection Law", 3.3f, 6, 4, null, false, PDFParser.GradeType.NUMERIC));
		assertEquals(expected.size(), returnedObjects.size());
		for (int i = 0; i < expected.size(); i++) {
			assertEquals(expected.get(i), returnedObjects.get(i));
		}
	}
}
