package tum.devops.http418.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.api.dto.*;
import tum.devops.http418.data.CoursesDataDB;
import tum.devops.http418.data.StudentDataDB;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static tum.devops.http418.Http418Application.*;

@Slf4j
@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/${API_VERSION}/me/advisor")
public class APIControllerMeAdvisor {

	private final StudentDataDB studentDataDB;
	private final CoursesDataDB coursesDataDB;
	private final ObjectMapper objectMapper;

	public enum MessageRole {
		USER, ASSISTANT
	}

	@GetMapping("/conversations")
	public ResponseEntity<PageDTO<ConversationSummaryDTO>> getConversations(@AuthenticationPrincipal String tumid,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		final List<StudentDataDB.ConversationRow> rows = studentDataDB.getConversations(tumid, page, size);
		final int total = studentDataDB.countConversations(tumid);
		final List<ConversationSummaryDTO> dtos = rows.stream()
				.map(row -> new ConversationSummaryDTO(row.id(), row.title(),
						row.createdAt() != null ? row.createdAt().toString() : null,
						row.updatedAt() != null ? row.updatedAt().toString() : null))
				.toList();
		return ResponseEntity.ok(PageDTO.of(dtos, page, size, total));
	}

	@PostMapping("/conversations")
	public ResponseEntity<ConversationDTO> createConversation(@AuthenticationPrincipal String tumid,
			@Valid @RequestBody CreateConversationRequest request) {
		final String title = request.title();
		final StudentDataDB.ConversationRow row = studentDataDB.insertConversation(tumid, title);
		return ResponseEntity.status(HttpStatus.CREATED).body(new ConversationDTO(row.id(), row.title(),
				row.createdAt() != null ? row.createdAt().toString() : null,
				row.updatedAt() != null ? row.updatedAt().toString() : null, List.of()));
	}

	@GetMapping("/conversations/{id}")
	public ResponseEntity<ConversationDTO> getConversation(@AuthenticationPrincipal String tumid,
			@PathVariable String id) {
		final StudentDataDB.ConversationRow conv = studentDataDB.getConversation(id, tumid);
		if (conv == null) {
			return ResponseEntity.notFound().build();
		}
		final List<ConversationMessageDTO> messages = studentDataDB.getMessages(id).stream()
				.map(msg -> new ConversationMessageDTO(msg.id(), msg.role(), msg.content(), msg.referencedCourses(),
						msg.createdAt() != null ? msg.createdAt().toString() : null))
				.toList();
		return ResponseEntity.ok(new ConversationDTO(conv.id(), conv.title(),
				conv.createdAt() != null ? conv.createdAt().toString() : null,
				conv.updatedAt() != null ? conv.updatedAt().toString() : null, messages));
	}

	@PostMapping(value = "/conversations/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter sendMessage(@AuthenticationPrincipal String tumid, @PathVariable String id,
			@Valid @RequestBody SendMessageRequest request) {
		final StudentDataDB.ConversationRow conv = studentDataDB.getConversation(id, tumid);
		if (conv == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found");
		}

		Profile profile = restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		if (profile == null || profile.student() == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
		}

		final List<StudentDataDB.MessageRow> history = studentDataDB.getMessages(id);
		final List<Map<String, String>> historyPayload = history.stream()
				.map(msg -> Map.of("role", msg.role(), "content", msg.content())).toList();

		studentDataDB.insertMessage(id, MessageRole.USER, request.content(), List.of());

		final SseEmitter emitter = new SseEmitter(60000L);
		final SecurityContext context = SecurityContextHolder.getContext();

		Thread.startVirtualThread(() -> {
			SecurityContextHolder.setContext(context);
			HttpURLConnection connection = null;
			try {
				final String genaiUrl = GENAI_PATH + "/me/advisor/conversations/%s/messages".formatted(id);
				final Map<String, Object> studentPayload = new LinkedHashMap<>();
				studentPayload.put("studyProgramName", profile.student().studyProgramName());
                studentPayload.put("studyProgramId", profile.student().studyProgramId());
				studentPayload.put("semester", profile.student().semester());
				studentPayload.put("careerGoals", profile.student().careerGoals());
				studentPayload.put("interests", profile.student().interests());
				studentPayload.put("totalCreditsEarned", profile.student().creditsEarned());
				studentPayload.put("totalCreditsRequired", profile.student().creditsRequired());
				studentPayload.put("preferredWorkload", profile.student().preferredWorkload());

				final List<StudentDataDB.CompletedCourseRow> completedRows = studentDataDB.getCompletedCourses(tumid, 0, 1000);
				final List<Long> completedIds = completedRows.stream().map(StudentDataDB.CompletedCourseRow::courseId).filter(cid -> cid != null).toList();
				final Map<Long, CoursesDataDB.CourseDataRow> completedCourseData = coursesDataDB
						.getCourseDataForIds(completedIds).stream()
						.collect(java.util.stream.Collectors.toMap(CoursesDataDB.CourseDataRow::id, r -> r, (a, b) -> a));
				final List<Map<String, Object>> completedCoursesPayload = completedRows.stream()
						.filter(row -> row.courseId() != null)
						.map(row -> {
							final CoursesDataDB.CourseDataRow cd = completedCourseData.get(row.courseId());
							final Map<String, Object> m = new LinkedHashMap<>();
							m.put("courseCode", cd != null ? cd.key() : String.valueOf(row.courseId()));
							m.put("courseName", cd != null && cd.title_en() != null ? cd.title_en() : "Unknown");
							m.put("credits", row.credits());
							return m;
						}).toList();

				final List<StudentDataDB.EnrolledCourseRow> enrolledRows = studentDataDB.getEnrolledCourses(tumid, 0, 100);
				final List<String> enrolledNames = enrolledRows.stream()
						.map(row -> coursesDataDB.getCourseTitleEn(row.courseId()))
						.filter(name -> name != null)
						.toList();

				final Map<String, Object> requestBody = new LinkedHashMap<>();
				requestBody.put("student", studentPayload);
				requestBody.put("completedCourses", completedCoursesPayload);
				requestBody.put("enrolledCourses", enrolledNames);
				requestBody.put("conversationHistory", historyPayload);
				requestBody.put("newMessage", request.content()); // the current user turn, as a plain String

				final String body = objectMapper.writeValueAsString(requestBody);

				connection = (HttpURLConnection) URI.create(genaiUrl).toURL().openConnection();
				connection.setRequestMethod("POST");
				connection.setRequestProperty("Content-Type", "application/json");
				connection.setRequestProperty("Accept", "text/event-stream");
				connection.setDoOutput(true);
				connection.setConnectTimeout(5000);
				connection.setReadTimeout(30000);
				connection.getOutputStream().write(body.getBytes(StandardCharsets.UTF_8));

				final StringBuilder fullResponse = new StringBuilder();
				try (BufferedReader reader = new BufferedReader(
						new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
					String line;
					while ((line = reader.readLine()) != null) {
						if (line.startsWith("data: ")) {
							final String data = line.substring(6);
							if ("[DONE]".equals(data)) {
								break;
							}

							try {
								final Map<String, Object> json = objectMapper.readValue(data, Map.class);
								if (json.containsKey("token")) {
									final String token = (String) json.get("token");
									fullResponse.append(token);
									emitter.send(SseEmitter.event().data(token));
								} else if (json.containsKey("fullContent")) {
								}
							} catch (Exception e) {
								log.warn("Failed to parse SSE data: {}", data);
							}
						}
					}
				}

				studentDataDB.insertMessage(id, MessageRole.ASSISTANT, fullResponse.toString(), List.of()); // TODO add previous list?
				emitter.complete();
			} catch (Exception e) {
				log.error("Error streaming advisor response for conversation {}", id, e);
				studentDataDB.insertMessage(id, MessageRole.ASSISTANT,
						"I'm sorry, I'm unable to respond right now. Please try again later.", List.of()); // TODO add previous list?
				try {
					emitter.send(SseEmitter.event().data("I'm sorry, I'm unable to respond right now."));
				} catch (Exception sendErr) {
					log.debug("Failed to send error SSE event", sendErr);
				}
				emitter.complete();
			} finally {
				if (connection != null) {
					connection.disconnect();
				}
				SecurityContextHolder.clearContext();
			}
		});

		return emitter;
	}

	@GetMapping("/suggestions")
	public ResponseEntity<String> getSuggestions(@AuthenticationPrincipal String tumid) {
		try {
			final String response = restClient.get().uri(GENAI_PATH + "/me/advisor/suggestions").retrieve()
					.body(String.class);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.ok("[]");
		}
	}
}
