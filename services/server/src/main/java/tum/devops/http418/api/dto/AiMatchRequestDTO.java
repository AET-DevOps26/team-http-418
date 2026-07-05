package tum.devops.http418.api.dto;

import java.util.List;

public record AiMatchRequestDTO(List<Module> modules) {
	public record Module(String moduleId, String titleEn, String titleDe) {}
}
