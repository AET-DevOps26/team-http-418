package tum.devops.http418.api.dto;

public record TranscriptImportResultDTO(int imported, int skipped, String message) {
}
