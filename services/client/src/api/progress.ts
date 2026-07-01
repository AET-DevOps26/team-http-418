import { apiFetch } from "#/api/client";
import type {
	AcademicProgress,
	AddCompletedCourseRequest,
	CompletedCourse,
	DegreeRequirements,
	EnrollCourseRequest,
	EnrolledCourse,
	Page,
	TranscriptImportResult,
} from "#/api/types";

export function uploadTranscript(file: File): Promise<TranscriptImportResult> {
	const form = new FormData();
	form.append("file", file);
	return apiFetch<TranscriptImportResult>("/me/transcript/upload", {
		method: "POST",
		body: form,
	});
}

export function getProgress(): Promise<AcademicProgress> {
	return apiFetch<AcademicProgress>("/me/progress");
}

export function getCompletedCourses(
	page: number,
	size: number,
): Promise<Page<CompletedCourse>> {
	return apiFetch<Page<CompletedCourse>>(
		`/me/courses/completed?page=${page}&size=${size}`,
	);
}

export function addCompletedCourse(
	body: AddCompletedCourseRequest,
): Promise<CompletedCourse> {
	return apiFetch<CompletedCourse>("/me/courses/completed", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export function removeCompletedCourse(courseId: string): Promise<void> {
	return apiFetch<void>(`/me/courses/completed/${courseId}`, {
		method: "DELETE",
	});
}

export function getEnrolledCourses(
	page: number,
	size: number,
): Promise<Page<EnrolledCourse>> {
	return apiFetch<Page<EnrolledCourse>>(
		`/me/courses/enrolled?page=${page}&size=${size}`,
	);
}

export function enrollCourse(
	body: EnrollCourseRequest,
): Promise<EnrolledCourse> {
	return apiFetch<EnrolledCourse>("/me/courses/enrolled", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export function dropCourse(courseId: string): Promise<void> {
	return apiFetch<void>(`/me/courses/enrolled/${courseId}`, {
		method: "DELETE",
	});
}

export function getRequirements(): Promise<DegreeRequirements> {
	return apiFetch<DegreeRequirements>("/me/requirements");
}
