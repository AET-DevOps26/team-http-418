package tum.devops.http418.api.dto;

import java.util.List;

public record WeeklyScheduleDTO(String semester, List<ScheduleEventDTO> events) {
}
