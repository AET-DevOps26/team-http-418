import { apiFetch } from "#/api/client";
import type { WeeklySchedule } from "#/api/types";

export function getSchedule(semester?: string): Promise<WeeklySchedule> {
	const query = semester ? `?semester=${semester}` : "";
	return apiFetch<WeeklySchedule>(`/me/schedule${query}`);
}
