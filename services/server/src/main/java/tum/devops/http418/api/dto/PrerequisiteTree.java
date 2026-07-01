package tum.devops.http418.api.dto;

import java.util.List;

public record PrerequisiteTree(long courseId, String courseCode, String courseName,
		List<PrerequisiteNode> prerequisites) {
	public record PrerequisiteNode(long courseId, String courseCode, String courseName,
			String type, List<PrerequisiteNode> prerequisites) {
	}
}
