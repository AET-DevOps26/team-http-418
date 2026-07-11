import { apiFetch } from "#/api/client";
import type { StudentProfile } from "#/api/types";

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

export async function completeOnboarding(
	data: Partial<NonNullable<StudentProfile["student"]>>,
): Promise<StudentProfile> {
	const current = await getProfile();
	const merged: StudentProfile = {
		...current,
		student: {
			...current.student,
			...data,
			onboardingCompleted: true,
		},
	};
	return updateProfile(merged);
}
