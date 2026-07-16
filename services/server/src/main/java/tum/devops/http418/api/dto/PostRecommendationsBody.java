package tum.devops.http418.api.dto;

import java.util.List;

public record PostRecommendationsBody(List<String> excludeCourseIds) {
}
