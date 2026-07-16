package tum.devops.http418;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static tum.devops.http418.Http418Application.restClient;

/**
 * Regression test for the static restClient silently sending empty bodies
 * when posting Java objects as application/json (see CLAUDE.md, "Server →
 * GenAI" pitfalls). Uses a plain JDK HttpServer to capture exactly what goes
 * over the wire.
 */
class RestClientJsonBodyTest {

	record SamplePayload(String name, int semester, List<String> interests) {
	}

	private static HttpServer server;
	private static String baseUrl;
	private static final AtomicReference<String> receivedBody = new AtomicReference<>();
	private static final AtomicReference<String> receivedContentType = new AtomicReference<>();

	@BeforeAll
	static void startServer() throws Exception {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/echo", exchange -> {
			receivedBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
			receivedContentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
			byte[] ok = "{}".getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().set("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, ok.length);
			exchange.getResponseBody().write(ok);
			exchange.close();
		});
		server.start();
		baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
	}

	@AfterAll
	static void stopServer() {
		server.stop(0);
	}

	@Test
	void postJavaObjectAsJsonSendsSerializedBody() {
		receivedBody.set(null);
		final SamplePayload payload = new SamplePayload("Ada", 3, List.of("ML", "Security"));

		restClient.post()
				.uri(baseUrl + "/echo")
				.contentType(MediaType.APPLICATION_JSON)
				.body(payload)
				.retrieve()
				.body(String.class);

		final String body = receivedBody.get();
		assertTrue(body != null && !body.isBlank(), "JSON body was dropped — server received an empty body");
		assertTrue(body.contains("\"name\":\"Ada\""), "unexpected body: " + body);
		assertTrue(body.contains("\"semester\":3"), "unexpected body: " + body);
	}

	@Test
	void postMapAsJsonSendsSerializedBody() {
		receivedBody.set(null);

		restClient.post()
				.uri(baseUrl + "/echo")
				.contentType(MediaType.APPLICATION_JSON)
				.body(Map.of("student", Map.of("semester", 2)))
				.retrieve()
				.body(String.class);

		final String body = receivedBody.get();
		assertTrue(body != null && !body.isBlank(), "JSON body was dropped — server received an empty body");
		assertTrue(body.contains("\"semester\":2"), "unexpected body: " + body);
	}

	@Test
	void jsonResponseDeserializesIntoJavaObject() {
		final Map<?, ?> result = restClient.get()
				.uri(baseUrl + "/echo")
				.retrieve()
				.body(Map.class);
		assertEquals(Map.of(), result, "expected empty JSON object to deserialize");
	}
}
