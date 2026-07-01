import { useReducer } from "react";
import type { Dispatch } from "react";
import type {
	ImportedCourse,
	TranscriptImportResult,
	UnmatchedModule,
} from "#/api/types";

export type ImportPhase = "empty" | "review" | "done";

export type UnmatchedCourse = {
	module: UnmatchedModule;
	originalError: string;
	skipped: boolean;
};

export type ReviewableCourse = ImportedCourse & {
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

const UNMATCHED_PATTERN = /^No catalog match for ([^:]+): (.+)$/;
const ALREADY_IMPORTED_PATTERN =
	/^Already imported: ([^\s(]+)\s*(?:\(([^)]+)\))?/;

type ParsedErrors = {
	unmatched: UnmatchedCourse[];
	alreadyImported: ReviewableCourse[];
	general: string[];
};

function parseErrors(errors: string[]): ParsedErrors {
	const unmatched: UnmatchedCourse[] = [];
	const alreadyImported: ReviewableCourse[] = [];
	const general: string[] = [];
	for (const err of errors) {
		const unmatchedMatch = UNMATCHED_PATTERN.exec(err);
		if (unmatchedMatch) {
			unmatched.push({
				module: {
					moduleId: unmatchedMatch[1].trim(),
					titleEn: unmatchedMatch[2].trim(),
				},
				originalError: err,
				skipped: false,
			});
			continue;
		}
		const alreadyMatch = ALREADY_IMPORTED_PATTERN.exec(err);
		if (alreadyMatch) {
			alreadyImported.push({
				moduleId: alreadyMatch[1].trim(),
				courseName: alreadyMatch[2]?.trim() ?? alreadyMatch[1].trim(),
				credits: 0,
			});
			continue;
		}
		general.push(err);
	}
	return { unmatched, alreadyImported, general };
}

const initialState: ImportState = {
	phase: "empty",
	imported: [],
	unmatched: [],
	generalErrors: [],
};

function toErrorString(e: TranscriptImportResult["errors"][number]): string {
	return typeof e === "string" ? e : e.message;
}

function reducer(state: ImportState, action: ImportAction): ImportState {
	switch (action.type) {
		case "UPLOAD_SUCCESS": {
			const { result } = action;
			const allErrors = result.errors.map(toErrorString);
			const parsed = parseErrors(allErrors);

			let unmatched = parsed.unmatched;
			if (result.unmatchedModules && result.unmatchedModules.length > 0) {
				unmatched = result.unmatchedModules.map((m) => ({
					module: m,
					originalError: `No catalog match for ${m.moduleId ?? ""}: ${m.titleEn ?? m.titleDe ?? ""}`,
					skipped: false,
				}));
			}

			const imported = [
				...(result.importedCourses as ReviewableCourse[]),
				...parsed.alreadyImported,
			];

			return {
				phase: "review",
				imported,
				unmatched,
				generalErrors: parsed.general,
			};
		}

		case "RESOLVE_COURSE": {
			return {
				...state,
				imported: [...state.imported, action.course],
				unmatched: state.unmatched.filter(
					(u) => u.module.moduleId !== action.moduleId,
				),
			};
		}

		case "UNRESOLVE_COURSE": {
			const course = state.imported.find((c) => c.courseId === action.courseId);
			if (!course) return state;
			const unmatchedCourse: UnmatchedCourse = {
				module: {
					moduleId: course.moduleId,
					titleEn: course.titleEn,
					titleDe: course.titleDe,
					grade: course.grade,
					credits: course.credits,
				},
				originalError: `No catalog match for ${course.moduleId ?? ""}: ${course.titleEn ?? course.titleDe ?? ""}`,
				skipped: false,
			};
			return {
				...state,
				imported: state.imported.filter((c) => c.courseId !== action.courseId),
				unmatched: [...state.unmatched, unmatchedCourse],
			};
		}

		case "EDIT_COURSE": {
			return {
				...state,
				imported: state.imported.map((c) =>
					c.courseId === action.courseId ? { ...c, ...action.updates } : c,
				),
			};
		}

		case "SKIP_COURSE": {
			return {
				...state,
				unmatched: state.unmatched.map((u) =>
					u.module.moduleId === action.moduleId ? { ...u, skipped: true } : u,
				),
			};
		}

		case "FINISH_IMPORT":
			return { ...state, phase: "done" };

		case "RESET":
			return initialState;

		default:
			return state;
	}
}

const STORAGE_KEY = "import-state";

function loadState(): ImportState {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		/* ignore */
	}
	return initialState;
}

function saveState(state: ImportState) {
	try {
		if (state.phase === "empty") {
			sessionStorage.removeItem(STORAGE_KEY);
		} else {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		}
	} catch {
		/* ignore */
	}
}

function persistingReducer(
	state: ImportState,
	action: ImportAction,
): ImportState {
	const next = reducer(state, action);
	saveState(next);
	return next;
}

export function useImportReducer(): [ImportState, Dispatch<ImportAction>] {
	return useReducer(persistingReducer, undefined, loadState);
}
