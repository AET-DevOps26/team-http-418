package tum.devops.http418.api.dto;

import java.time.LocalTime;

public record Appointment(String weekday_key, LocalTime time_from, LocalTime time_to, String place, boolean is_series) {
}
