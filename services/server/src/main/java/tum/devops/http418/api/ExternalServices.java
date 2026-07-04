package tum.devops.http418.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tum.devops.http418.api.dto.Profile;

import static tum.devops.http418.Http418Application.*;

@Service
public class ExternalServices {

	@Value("${TRANSCRIPT_USE_AI:false}")
	private boolean transcriptAiEnabled;

	public boolean isTranscriptAiEnabled() {
		return transcriptAiEnabled;
	}

	public String callPdfParser(byte[] fileBytes) {
		return restClient.post()
				.uri(PDF_PARSER_SERVICE + "/parse-pdf")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(fileBytes)
				.retrieve()
				.body(String.class);
	}

	public String callTranscriptMatch(String body) {
		return restClient.post()
				.uri(GENAI_PATH + "/transcript/match")
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.retrieve()
				.body(String.class);
	}

	public Profile.CvData callCvParse(byte[] fileBytes) {
		return restClient.post()
				.uri(GENAI_PATH + "/cv/parse")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(fileBytes)
				.retrieve()
				.body(Profile.CvData.class);
	}

	public Profile fetchProfile(String tumid) {
		try {
			return restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		} catch (Exception e) {
			return null;
		}
	}
}
