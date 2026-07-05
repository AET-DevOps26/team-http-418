import { apiFetch } from "#/api/client";
import type {
	AcademicProgress,
	AddCompletedCourseRequest,
	AiMatchModule,
	AiMatchResponse,
	CompletedCourse,
	DegreeRequirements,
	EnrollCourseRequest,
	EnrolledCourse,
	ImportState,
	Page,
	TranscriptImportResult,
} from "#/api/types";

type ProgressDTO = {
	totalCredits: number;
	gpa: number | null;
	completedCourses: number;
	enrolledCourses: number;
	creditsByCategory?: { category: string; credits: number }[];
};

type RequirementsDTO = {
	totalCredits: number;
	creditsByCategory?: { category: string; credits: number }[];
	completedCourses?: CompletedCourse[];
};

export function uploadTranscript(file: File): Promise<TranscriptImportResult> {
	const form = new FormData();
	form.append("file", file);
	return apiFetch<TranscriptImportResult>("/me/transcript/upload", {
		method: "POST",
		body: form,
	});
}

export function getProgress(): Promise<AcademicProgress> {
	return apiFetch<ProgressDTO>("/me/progress").then((dto) => ({
		totalCreditsEarned: dto.totalCredits,
		totalCreditsRequired: 0,
		gpa: dto.gpa ?? 0,
		completedCourseCount: dto.completedCourses,
		enrolledCourseCount: dto.enrolledCourses,
		currentSemester: "" as AcademicProgress["currentSemester"],
		progressPercentage: 0,
		creditsByCategory: (dto.creditsByCategory ?? []).map((row) => ({
			category: row.category,
			earned: row.credits,
			required: row.credits,
		})),
	}));
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
	return apiFetch<RequirementsDTO>("/me/requirements").then((dto) => ({
		studyProgram: { id: "", name: "Degree Requirements" },
		totalCreditsRequired: dto.totalCredits,
		totalCreditsEarned: dto.totalCredits,
		categories: (dto.creditsByCategory ?? []).map((row) => ({
			name: row.category,
			creditsRequired: row.credits,
			creditsEarned: row.credits,
			fulfilled: true,
			courses: (dto.completedCourses ?? [])
				.filter((course) => course.category === row.category)
				.map((course) => ({
					courseId: course.courseId,
					courseCode: course.courseCode,
					courseName: course.courseName,
					credits: course.credits,
					status: "COMPLETED",
					isRequired: false,
				})),
		})),
		alerts: [],
	}));
}

export function aiMatchTranscript(
	modules: AiMatchModule[],
): Promise<AiMatchResponse> {
	return apiFetch<AiMatchResponse>("/me/transcript/ai-match", {
		method: "POST",
		body: JSON.stringify({ modules }),
	});
}

export function getImportState(): Promise<ImportState> {
	return apiFetch<ImportState>("/me/transcript/import-state");
}

export function confirmImport(): Promise<void> {
	return apiFetch<void>("/me/transcript/confirm", { method: "POST" });
}

export function cancelImport(): Promise<void> {
	return apiFetch<void>("/me/transcript/cancel", { method: "POST" });
}

export function resolveImportCourse(
	id: number,
	courseId: number,
	category?: string,
): Promise<void> {
	return apiFetch<void>(`/me/transcript/import/${id}/resolve`, {
		method: "PUT",
		body: JSON.stringify({ courseId, category }),
	});
}

export function skipImportCourse(id: number): Promise<void> {
	return apiFetch<void>(`/me/transcript/import/${id}/skip`, {
		method: "PUT",
	});
}

export function unskipImportCourse(id: number): Promise<void> {
	return apiFetch<void>(`/me/transcript/import/${id}/unskip`, {
		method: "PUT",
	});
}

export function unresolveImportCourse(id: number): Promise<void> {
	return apiFetch<void>(`/me/transcript/import/${id}/unresolve`, {
		method: "PUT",
	});
}

export function updateImportGrade(id: number, grade: number): Promise<void> {
	return apiFetch<void>(`/me/transcript/import/${id}/grade`, {
		method: "PUT",
		body: JSON.stringify({ grade }),
	});
}
