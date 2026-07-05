package tum.devops.http418.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ImportStateDTO(
		boolean active,
		List<ImportRow> pending,
		List<ImportRow> unmatched,
		List<ImportRow> skipped) {

	public record ImportRow(long id, Long courseId, String courseName, String moduleId,
			String moduleTitle, BigDecimal grade, int credits, String category, String status) {
	}
}
