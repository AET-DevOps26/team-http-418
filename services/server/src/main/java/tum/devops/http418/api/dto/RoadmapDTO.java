package tum.devops.http418.api.dto;

import org.springframework.lang.Nullable;

import java.util.List;

public record RoadmapDTO(String status, String createdAt, String updatedAt,
		List<SemesterPlanDetailDTO> semesters, int totalPlannedCredits, @Nullable String estimatedGraduation) {
}
