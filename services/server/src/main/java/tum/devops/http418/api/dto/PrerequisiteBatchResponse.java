package tum.devops.http418.api.dto;

import java.util.List;

public record PrerequisiteBatchResponse(List<PrerequisiteTree> trees, List<Long> missingCourseIds) {
}
