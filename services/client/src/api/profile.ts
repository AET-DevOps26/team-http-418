import { apiFetch } from "#/api/client";
import type { CvData, StudentProfile, StudentProfileUpdate } from "#/api/types";

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

export function uploadCv(file: File): Promise<CvData> {
	const form = new FormData();
	form.append("file", file);
	return apiFetch<CvData>("/me/cv/upload", {
		method: "POST",
		body: form,
	});
}

export function completeOnboarding(data: Partial<StudentProfileUpdate>): Promise<StudentProfile> {
	return patchProfile({ ...data, onboardingCompleted: true });
}
