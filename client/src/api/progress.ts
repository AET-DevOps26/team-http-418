import { apiFetch } from "#/api/client";
import type { TranscriptImportResult } from "#/api/types";

export function uploadTranscript(file: File): Promise<TranscriptImportResult> {
	const form = new FormData();
	form.append("file", file);
	return apiFetch<TranscriptImportResult>("/me/transcript/upload", {
		method: "POST",
		body: form,
	});
}
