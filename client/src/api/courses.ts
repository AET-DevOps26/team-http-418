import { apiFetch } from "#/api/client";
import type {
	CourseDetail,
	CourseSearchParams,
	CourseSummary,
	Page,
	PrerequisiteCheck,
	PrerequisiteTree,
} from "#/api/types";

function buildQuery(params: Record<string, unknown>): string {
	const qs = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined || value === null || value === "") continue;
		qs.set(key, String(value));
	}
	const str = qs.toString();
	return str ? `?${str}` : "";
}

export function getCourses(
	params: CourseSearchParams,
): Promise<Page<CourseSummary>> {
	const { creditsMin, creditsMax, ...rest } = params;
	const raw: Record<string, unknown> = { ...rest };
	if (creditsMin !== undefined) raw.credits_min = creditsMin;
	if (creditsMax !== undefined) raw.credits_max = creditsMax;
	return apiFetch<Page<CourseSummary>>(`/courses${buildQuery(raw)}`);
}

export function getCourse(courseId: string): Promise<CourseDetail> {
	return apiFetch<CourseDetail>(`/courses/${courseId}`);
}

export function getCoursePrerequisites(
	courseId: string,
): Promise<PrerequisiteTree> {
	return apiFetch<PrerequisiteTree>(`/courses/${courseId}/prerequisites`);
}

export function checkPrerequisites(
	courseId: string,
): Promise<PrerequisiteCheck> {
	return apiFetch<PrerequisiteCheck>(
		`/courses/${courseId}/prerequisites/check`,
	);
}
