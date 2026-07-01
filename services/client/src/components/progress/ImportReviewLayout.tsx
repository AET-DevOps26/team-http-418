import type { Dispatch } from "react";
import { AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";
import type { ImportAction, ImportState } from "#/hooks/useImportReducer";
import { ImportedTable } from "./ImportedTable";
import { UnmatchedTable } from "./UnmatchedTable";

type Props = {
	state: ImportState;
	dispatch: Dispatch<ImportAction>;
};

export function ImportReviewLayout({ state, dispatch }: Props) {
	const activeUnmatched = state.unmatched.filter((u) => !u.skipped);

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
					Resolve unmatched courses before finishing the import
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

			<div
				style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}
			>
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
