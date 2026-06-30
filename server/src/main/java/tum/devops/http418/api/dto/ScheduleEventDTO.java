package tum.devops.http418.api.dto;

import java.time.LocalTime;

public record ScheduleEventDTO(long courseId, String courseName, String weekday, LocalTime timeFrom, LocalTime timeTo,
		String place) {
}
