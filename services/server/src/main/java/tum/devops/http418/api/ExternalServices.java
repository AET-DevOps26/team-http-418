package tum.devops.http418.api;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;
import tum.devops.http418.api.dto.Profile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import static tum.devops.http418.Http418Application.*;

@RequiredArgsConstructor
@Service
public class ExternalServices {

	private final ObjectMapper objectMapper;
	private static final HttpClient httpClient = HttpClient.newBuilder()
			.version(HttpClient.Version.HTTP_1_1)
			.build();

	public String callPdfParser(byte[] fileBytes) {
		return restClient.post()
				.uri(PDF_PARSER_SERVICE + "/parse-pdf")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(fileBytes)
				.retrieve()
				.body(String.class);
	}

	public String callTranscriptMatch(Object body) {
		try {
			final String json = objectMapper.writeValueAsString(body);
			final HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(GENAI_PATH + "/transcript/match"))
					.header("Content-Type", "application/json")
					.POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
					.build();
			final HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() >= 400) {
				throw new RuntimeException(response.statusCode() + " " + response.body());
			}
			return response.body();
		} catch (RuntimeException e) {
			throw e;
		} catch (Exception e) {
			throw new RuntimeException("Transcript match request failed", e);
		}
	}

	public Profile fetchProfile(String tumid) {
		try {
			return restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		} catch (Exception e) {
			return null;
		}
	}
}
