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

type ServerCourse = {
	id: string;
	title_ger: string;
	title_en: string;
	key: string;
};

function toCourseSummary(c: ServerCourse): CourseSummary {
	return {
		id: String(c.id),
		courseCode: c.key ?? "",
		name: c.title_en ?? c.title_ger ?? "",
		department: "",
		credits: 0,
		language: "EN",
		level: "",
		preferredSemester: "",
		hasPrerequisites: false,
		instructors: [],
	};
}

export async function getCourses(
	params: CourseSearchParams,
): Promise<Page<CourseSummary>> {
	const { creditsMin, creditsMax, ...rest } = params;
	const raw: Record<string, unknown> = { ...rest };
	if (creditsMin !== undefined) raw.credits_min = creditsMin;
	if (creditsMax !== undefined) raw.credits_max = creditsMax;
	const data = await apiFetch<ServerCourse[]>(`/courses${buildQuery(raw)}`);
	const content = data.map(toCourseSummary);
	const page = params.page ?? 0;
	const size = params.size ?? 20;
	const last = content.length < size;
	return {
		content,
		totalElements: last ? page * size + content.length : (page + 1) * size + 1,
		totalPages: last ? page + 1 : page + 2,
		number: page,
		size,
		first: page === 0,
		last,
		empty: content.length === 0,
	};
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
