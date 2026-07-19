package tum.devops.http418;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.Test;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/** Keeps the server and Pydantic roadmap payload contract on the same versioned fixture. */
class GenAiPayloadContractTest {

	@Test
	void roadmapPayloadFixtureHasTheFieldsSerializedForGenAi() throws Exception {
		final Path fixture = Path.of("..", "genai", "evals", "fixtures", "roadmap-contract.v1.json");
		final Map<String, Object> payload = new ObjectMapper().readValue(Files.readString(fixture),
				new TypeReference<Map<String, Object>>() {
				});
		assertThat(payload).containsKeys("student", "completedCourses", "enrolledCourses", "degreeRequirements",
				"availableCourses", "currentSemesterKey");
		@SuppressWarnings("unchecked")
		final Map<String, Object> requirements = (Map<String, Object>) payload.get("degreeRequirements");
		assertThat(requirements).containsKeys("totalCreditsRequired",
				"totalCreditsEarned", "categories");
		@SuppressWarnings("unchecked")
		final Map<String, Object> course = (Map<String, Object>) ((java.util.List<?>) payload.get("availableCourses")).getFirst();
		assertThat(course).containsKeys("courseName",
				"credits", "category", "preferredSemester", "hasPrerequisites");
	}
}
