import { apiFetch } from "#/api/client";
import type { StudentProfile } from "#/api/types";

export function getProfile(): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me");
}

export function updateProfile(body: StudentProfile): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me", {
		method: "POST",
		body: JSON.stringify(body),
	});
}
