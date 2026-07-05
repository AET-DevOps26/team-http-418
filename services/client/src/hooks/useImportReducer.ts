import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
	cancelImport,
	confirmImport,
	getImportState,
	skipImportCourse,
	unresolveImportCourse,
	unskipImportCourse,
	updateImportGrade,
} from "#/api/progress";
import type {
	ImportRow,
	ImportState as ServerImportState,
	TranscriptImportResult,
	UnmatchedModule,
} from "#/api/types";

export type ImportPhase = "empty" | "review" | "done";

export type UnmatchedCourse = {
	rowId: number;
	module: UnmatchedModule;
	originalError: string;
	skipped: boolean;
};

export type ReviewableCourse = {
	rowId: number;
	courseId?: string;
	courseCode?: string;
	courseName?: string;
	moduleId?: string;
	titleDe?: string;
	titleEn?: string;
	grade?: string;
	credits: number;
	editedGrade?: string;
	editedCredits?: number;
};

export type ImportState = {
	phase: ImportPhase;
	imported: ReviewableCourse[];
	unmatched: UnmatchedCourse[];
	generalErrors: string[];
};

export type ImportAction =
	| { type: "UPLOAD_SUCCESS"; result: TranscriptImportResult }
	| { type: "RESOLVE_COURSE"; moduleId: string; course: ReviewableCourse }
	| { type: "UNRESOLVE_COURSE"; courseId: string }
	| {
			type: "EDIT_COURSE";
			courseId: string;
			updates: Partial<ReviewableCourse>;
	  }
	| { type: "SKIP_COURSE"; moduleId: string }
	| { type: "FINISH_IMPORT" }
	| { type: "RESET" };

function serverStateToLocal(
	server: ServerImportState | undefined,
): ImportState {
	if (!server || !server.active) {
		return { phase: "empty", imported: [], unmatched: [], generalErrors: [] };
	}

	const imported: ReviewableCourse[] = server.pending.map((row) => ({
		rowId: row.id,
		courseId: row.courseId != null ? String(row.courseId) : undefined,
		courseName: row.courseName ?? undefined,
		moduleId: row.moduleId ?? undefined,
		titleEn: row.moduleTitle ?? undefined,
		grade: row.grade != null ? String(row.grade) : undefined,
		credits: row.credits,
	}));

	const unmatched: UnmatchedCourse[] = [
		...server.unmatched.map((row) => rowToUnmatched(row, false)),
		...server.skipped.map((row) => rowToUnmatched(row, true)),
	];

	return { phase: "review", imported, unmatched, generalErrors: [] };
}

function rowToUnmatched(row: ImportRow, skipped: boolean): UnmatchedCourse {
	return {
		rowId: row.id,
		module: {
			moduleId: row.moduleId ?? "",
			titleEn: row.moduleTitle ?? undefined,
			grade: row.grade != null ? String(row.grade) : undefined,
			credits: row.credits,
		},
		originalError: `No catalog match for ${row.moduleId ?? ""}: ${row.moduleTitle ?? ""}`,
		skipped,
	};
}

const IMPORT_STATE_KEY = ["importState"];

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY });
	queryClient.invalidateQueries({ queryKey: ["completedCourses"] });
	queryClient.invalidateQueries({ queryKey: ["progress"] });
	queryClient.invalidateQueries({ queryKey: ["dashboard"] });
	queryClient.invalidateQueries({ queryKey: ["requirements"] });
}

export function useImportReducer(): [
	ImportState,
	(action: ImportAction) => void,
] {
	const queryClient = useQueryClient();
	const [doneSnapshot, setDoneSnapshot] = useState<ImportState | null>(null);

	const { data: serverState } = useQuery({
		queryKey: IMPORT_STATE_KEY,
		queryFn: getImportState,
		staleTime: 30_000,
		refetchOnWindowFocus: true,
	});

	const serverDerivedState = useMemo(
		() => serverStateToLocal(serverState),
		[serverState],
	);
	const state = doneSnapshot ?? serverDerivedState;

	const confirmMutation = useMutation({
		mutationFn: confirmImport,
		onSuccess: () => invalidateAll(queryClient),
	});

	const cancelMutation = useMutation({
		mutationFn: cancelImport,
		onSuccess: () => invalidateAll(queryClient),
	});

	const dispatch = useCallback(
		(action: ImportAction) => {
			switch (action.type) {
				case "UPLOAD_SUCCESS":
					setDoneSnapshot(null);
					queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY });
					break;
				case "RESOLVE_COURSE":
					queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY });
					break;
				case "UNRESOLVE_COURSE": {
					const row = serverDerivedState.imported.find(
						(c) => c.courseId === action.courseId,
					);
					if (row) {
						unresolveImportCourse(row.rowId).then(() =>
							queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY }),
						);
					}
					break;
				}
				case "EDIT_COURSE": {
					const row = serverDerivedState.imported.find(
						(c) => c.courseId === action.courseId,
					);
					if (row && action.updates.grade != null) {
						updateImportGrade(row.rowId, parseFloat(action.updates.grade)).then(
							() =>
								queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY }),
						);
					}
					break;
				}
				case "SKIP_COURSE": {
					const row = serverDerivedState.unmatched.find(
						(u) => u.module.moduleId === action.moduleId,
					);
					if (row) {
						const fn = row.skipped ? unskipImportCourse : skipImportCourse;
						fn(row.rowId).then(() =>
							queryClient.invalidateQueries({ queryKey: IMPORT_STATE_KEY }),
						);
					}
					break;
				}
				case "FINISH_IMPORT":
					setDoneSnapshot({
						...serverDerivedState,
						phase: "done",
					});
					confirmMutation.mutate();
					break;
				case "RESET":
					setDoneSnapshot(null);
					if (serverDerivedState.phase !== "empty") {
						cancelMutation.mutate();
					}
					break;
			}
		},
		[serverDerivedState, queryClient, confirmMutation, cancelMutation],
	);

	return [state, dispatch];
}
