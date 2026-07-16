package tum.devops.http418.api.dto;

import java.util.List;

public record PrerequisiteBatchRequest(List<Long> courseIds) {
}
