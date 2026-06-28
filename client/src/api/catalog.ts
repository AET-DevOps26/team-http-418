import { apiFetch } from "#/api/client";
import type { Department, StudyProgram } from "#/api/types";

export function getDepartments(): Promise<Department[]> {
	return apiFetch<Department[]>("/departments");
}

export function getStudyPrograms(departmentId?: string): Promise<StudyProgram[]> {
	const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : "";
	return apiFetch<StudyProgram[]>(`/study-programs${qs}`);
}
