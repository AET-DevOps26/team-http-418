import { apiFetch } from "#/api/client";
import type {
	AddCourseRequest,
	GenerateRoadmapRequest,
	Roadmap,
	SemesterPlanDetail,
} from "#/api/types";

export function getRoadmap(): Promise<Roadmap> {
	return apiFetch<Roadmap>("/me/roadmap");
}

export function generateRoadmap(
	body: GenerateRoadmapRequest,
): Promise<Roadmap> {
	return apiFetch<Roadmap>("/me/roadmap/generate", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export function updateRoadmap(body: Partial<Roadmap>): Promise<Roadmap> {
	return apiFetch<Roadmap>("/me/roadmap", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export function getSemesters(): Promise<SemesterPlanDetail[]> {
	return apiFetch<SemesterPlanDetail[]>("/me/roadmap/semesters");
}

export function getSemester(key: string): Promise<SemesterPlanDetail> {
	return apiFetch<SemesterPlanDetail>(`/me/roadmap/semesters/${key}`);
}

export function updateSemester(
	key: string,
	body: Partial<SemesterPlanDetail>,
): Promise<SemesterPlanDetail> {
	return apiFetch<SemesterPlanDetail>(`/me/roadmap/semesters/${key}`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export function addCourseToSemester(
	key: string,
	body: AddCourseRequest,
): Promise<SemesterPlanDetail> {
	return apiFetch<SemesterPlanDetail>(`/me/roadmap/semesters/${key}/courses`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export function removeCourseFromSemester(
	key: string,
	courseId: string,
): Promise<void> {
	return apiFetch<void>(`/me/roadmap/semesters/${key}/courses/${courseId}`, {
		method: "DELETE",
	});
}
