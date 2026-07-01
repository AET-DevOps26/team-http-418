import { useState } from "react";
import type { Dispatch } from "react";
import { Search } from "lucide-react";
import type { ImportAction, ImportState } from "#/hooks/useImportReducer";

type Props = {
	state: ImportState;
	dispatch: Dispatch<ImportAction>;
};

export function ImportOverview({ state, dispatch }: Props) {
	const [query, setQuery] = useState("");

	const { imported } = state;
	const totalCredits = imported.reduce((sum, c) => sum + c.credits, 0);
	const grades = imported.filter((c) => c.grade).map((c) => parseFloat(c.grade!));
	const avgGrade =
		grades.length > 0
			? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2)
			: null;

	const filtered = query.trim()
		? imported.filter((c) => {
				const q = query.toLowerCase();
				return (
					(c.courseName ?? "").toLowerCase().includes(q) ||
					(c.titleEn ?? "").toLowerCase().includes(q) ||
					(c.moduleId ?? "").toLowerCase().includes(q) ||
					(c.courseCode ?? "").toLowerCase().includes(q)
				);
			})
		: imported;

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
					Import Complete
				</h1>
				<p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
					{imported.length} course{imported.length !== 1 ? "s" : ""} imported successfully
				</p>
			</div>

			<div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
				<div className="card" style={{ padding: "14px 20px", minWidth: 120 }}>
					<div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
						Courses
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
						{imported.length}
					</div>
				</div>
				<div className="card" style={{ padding: "14px 20px", minWidth: 120 }}>
					<div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
						Total Credits
					</div>
					<div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
						{totalCredits}
					</div>
				</div>
				{avgGrade && (
					<div className="card" style={{ padding: "14px 20px", minWidth: 120 }}>
						<div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
							Avg Grade
						</div>
						<div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
							{avgGrade}
						</div>
					</div>
				)}
			</div>

			<div className="import-overview-search">
				<Search size={15} color="var(--muted)" />
				<input
					className="import-overview-search-input"
					placeholder="Search imported courses..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
				/>
			</div>

			<div className="card" style={{ overflow: "hidden", padding: "8px 20px 12px" }}>
				<table className="progress-table">
					<thead>
						<tr>
							<th>Module ID</th>
							<th>Course Name</th>
							<th>Grade</th>
							<th style={{ textAlign: "right" }}>Credits</th>
						</tr>
					</thead>
					<tbody>
						{filtered.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}
								>
									{query ? `No results for "${query}"` : "No courses"}
								</td>
							</tr>
						) : (
							filtered.map((c) => (
								<tr key={c.courseId ?? `${c.moduleId}-${c.courseName}`}>
									<td
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: 12,
											color: "var(--blue-700)",
										}}
									>
										{c.moduleId ?? c.courseCode ?? "—"}
									</td>
									<td>{c.courseName ?? c.titleEn ?? "—"}</td>
									<td>{c.grade ?? "—"}</td>
									<td style={{ textAlign: "right" }}>{c.credits}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div style={{ marginTop: 20 }}>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={() => dispatch({ type: "RESET" })}
				>
					Upload New Transcript
				</button>
			</div>
		</div>
	);
}
