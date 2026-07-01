package tum.devops.http418.api.dto;

import java.util.List;

public record TranscriptImportResultDTO(
		int importedCount,
		int skippedCount,
		List<ImportedCourse> importedCourses,
		List<String> errors,
		List<UnmatchedModule> unmatchedModules) {

	public record ImportedCourse(String courseId, String courseCode, String courseName,
			String moduleId, String titleDe, String titleEn, String grade, int credits) {
	}

	public record UnmatchedModule(String moduleId, String titleDe, String titleEn, String grade, int credits) {
	}
}
