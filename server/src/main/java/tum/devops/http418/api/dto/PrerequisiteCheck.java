package tum.devops.http418.api.dto;

import java.util.List;

public record PrerequisiteCheck(long courseId, String courseCode, boolean eligible,
		List<PrerequisiteCheckRef> unmetPrerequisites, List<PrerequisiteCheckRef> metPrerequisites) {
	public record PrerequisiteCheckRef(long courseId, String courseCode, String courseName, String type) {
	}
}
