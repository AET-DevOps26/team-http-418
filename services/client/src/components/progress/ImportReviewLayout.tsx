import { AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";
import type { Dispatch } from "react";
import { useState } from "react";
import { addCompletedCourse, aiMatchTranscript } from "#/api/progress";
import type { ImportAction, ImportState, ReviewableCourse } from "#/hooks/useImportReducer";
import { ImportedTable } from "./ImportedTable";
import { UnmatchedTable } from "./UnmatchedTable";

type Props = {
	state: ImportState;
	dispatch: Dispatch<ImportAction>;
};

export function ImportReviewLayout({ state, dispatch }: Props) {
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState<string | null>(null);
	const activeUnmatched = state.unmatched.filter((u) => !u.skipped);

	async function handleAiResolveAll() {
		const modules = activeUnmatched.map((u) => ({
			moduleId: u.module.moduleId ?? "",
			titleEn: u.module.titleEn,
			titleDe: u.module.titleDe,
		}));
		if (modules.length === 0) return;
		setAiLoading(true);
		setAiError(null);
		try {
			const result = await aiMatchTranscript(modules);
			for (const match of result.matches) {
				const unmatchedCourse = activeUnmatched.find(
					(u) => u.module.moduleId === match.moduleId,
				);
				if (!unmatchedCourse) continue;
				try {
					const completed = await addCompletedCourse({
						courseId: match.courseId,
						grade: parseFloat(unmatchedCourse.module.grade ?? "1.0"),
					});
					const reviewable: ReviewableCourse = {
						courseId: completed.courseId,
						courseCode: completed.courseCode || match.courseCode,
						courseName: completed.courseName || match.courseName,
						credits: completed.credits,
						grade: String(completed.grade),
						moduleId: unmatchedCourse.module.moduleId,
						titleEn: unmatchedCourse.module.titleEn,
						titleDe: unmatchedCourse.module.titleDe,
					};
					dispatch({
						type: "RESOLVE_COURSE",
						moduleId: match.moduleId,
						course: reviewable,
					});
				} catch {
					// individual failure — leave in unmatched
				}
			}
		} catch {
			setAiError("AI resolve failed. Try again.");
		} finally {
			setAiLoading(false);
		}
	}

	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 20 }}>
				<h1
					style={{
						margin: 0,
						fontSize: 24,
						fontWeight: 700,
						color: "var(--ink)",
						lineHeight: 1.2,
					}}
				>
					Review Import
				</h1>
				<p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
					Resolve or skip unmatched courses, then finish the import
				</p>
			</div>

			<div className="import-summary">
				<span className="import-stat import-stat--success">
					<CheckCircle size={15} strokeWidth={1.75} />
					{state.imported.length} imported
				</span>
				<span className="import-stat import-stat--muted">
					<MinusCircle size={15} strokeWidth={1.75} />
					{state.unmatched.length} unmatched
				</span>
			</div>

			{state.generalErrors.length > 0 && (
				<div className="alert-item alert-error" style={{ marginBottom: 20 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							marginBottom: 4,
							fontWeight: 500,
							fontSize: 13,
						}}
					>
						<AlertTriangle size={14} strokeWidth={2} />
						{state.generalErrors.length} error
						{state.generalErrors.length > 1 ? "s" : ""}
					</div>
					<ul
						style={{
							margin: 0,
							paddingLeft: 18,
							fontSize: 12.5,
							color: "var(--ink-soft)",
						}}
					>
						{state.generalErrors.map((e) => (
							<li key={e}>{e}</li>
						))}
					</ul>
				</div>
			)}

			<div className="import-review-grid">
				<div className="card" style={{ padding: 20 }}>
					<div className="eyebrow">Imported Courses</div>
					<ImportedTable imported={state.imported} dispatch={dispatch} />
				</div>
				<div className="card" style={{ padding: 20 }}>
					<div className="eyebrow">Unmatched Courses</div>
					<UnmatchedTable unmatched={state.unmatched} dispatch={dispatch} />
				</div>
			</div>

			{aiError && (
				<div
					className="alert-item alert-error"
					style={{ marginTop: 16, fontSize: 12.5 }}
				>
					{aiError}
				</div>
			)}

			<div
				style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}
			>
				<button
					type="button"
					className="btn btn-ghost"
					disabled={aiLoading || activeUnmatched.length === 0}
					onClick={handleAiResolveAll}
				>
					{aiLoading ? "AI Resolving..." : `AI Resolve All (${activeUnmatched.length})`}
				</button>
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => dispatch({ type: "FINISH_IMPORT" })}
				>
					{activeUnmatched.length === 0
						? "Finish Import"
						: `Finish Import (${activeUnmatched.length} unresolved)`}
				</button>
			</div>
		</div>
	);
}
