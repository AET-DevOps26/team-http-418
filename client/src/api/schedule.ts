import { apiFetch } from "#/api/client";
import type { WeeklySchedule } from "#/api/types";

export function getSchedule(semester?: string): Promise<WeeklySchedule> {
	const query = semester
		? `?${new URLSearchParams({ semester }).toString()}`
		: "";
	return apiFetch<WeeklySchedule>(`/me/schedule${query}`);
}
