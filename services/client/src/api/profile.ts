import { apiFetch } from "#/api/client";
import type { StudentProfile, StudentProfileUpdate } from "#/api/types";

export function getProfile(): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me");
}

export function updateProfile(
	body: StudentProfileUpdate,
): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export function patchProfile(
	partial: Partial<StudentProfileUpdate>,
): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me", {
		method: "PATCH",
		body: JSON.stringify(partial),
	});
}
