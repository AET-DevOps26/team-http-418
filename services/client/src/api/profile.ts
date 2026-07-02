import { apiFetch } from "#/api/client";
import type { CvData, StudentProfile, StudentProfileUpdate } from "#/api/types";

export function getProfile(): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me");
}

export function updateProfile(body: StudentProfile): Promise<StudentProfile> {
	return apiFetch<StudentProfile>("/me", {
		method: "POST",
		body: JSON.stringify(body),
		responseType: "text",
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
