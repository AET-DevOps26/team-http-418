package tum.devops.http418.api;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import tum.devops.http418.api.dto.Profile;

import static tum.devops.http418.Http418Application.*;

@Service
public class TranscriptService {

	public String callPdfParser(byte[] fileBytes) {
		return restClient.post()
				.uri(PDF_PARSER_SERVICE + "/parse-pdf")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(fileBytes)
				.retrieve()
				.body(String.class);
	}

	public Profile fetchProfile(String tumid) {
		try {
			return restClient.get().uri(PROFILE_SERVICE + "/get/" + tumid).retrieve().body(Profile.class);
		} catch (Exception e) {
			return null;
		}
	}
}
