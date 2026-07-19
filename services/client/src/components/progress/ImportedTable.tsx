import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { unresolveImportCourse, updateImportGrade } from "#/api/progress";
import type { ReviewableCourse } from "#/hooks/useImportReducer";

type Props = {
	imported: ReviewableCourse[];
};

type EditState = {
	rowId: number;
	courseId: string;
	grade: string;
};

export function ImportedTable({ imported }: Props) {
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState<EditState | null>(null);
	const [loadingId, setLoadingId] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	function startEdit(course: ReviewableCourse) {
		setEditing({
			rowId: course.rowId,
			courseId: course.courseId ?? "",
			grade: course.grade ?? "",
		});
		setError(null);
	}

	async function handleSave(course: ReviewableCourse) {
		if (!editing) return;
		const newGrade = parseFloat(editing.grade);
		if (Number.isNaN(newGrade)) {
			setError("Invalid grade value.");
			return;
		}
		setLoadingId(course.rowId);
		setError(null);
		try {
			await updateImportGrade(course.rowId, newGrade);
			await queryClient.refetchQueries({ queryKey: ["importState"] });
			setEditing(null);
		} catch {
			setError("Save failed. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleUnmatch(course: ReviewableCourse) {
		setLoadingId(course.rowId);
		setError(null);
		try {
			await unresolveImportCourse(course.rowId);
			await queryClient.refetchQueries({ queryKey: ["importState"] });
		} catch {
			setError("Unmatch failed. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	if (imported.length === 0) {
		return (
			<div
				style={{
					padding: "32px 0",
					textAlign: "center",
					color: "var(--muted)",
					fontSize: 13,
				}}
			>
				No imported courses yet
			</div>
		);
	}

	return (
		<div>
			{error && (
				<div
					className="alert-item alert-error"
					style={{ marginBottom: 12, fontSize: 12.5 }}
				>
					{error}
				</div>
			)}
			<table className="progress-table">
				<thead>
					<tr>
						<th>Transcript Subject</th>
						<th>Matched Course</th>
						<th>Grade</th>
						<th>Credits</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{imported.map((c) => {
						const key = c.rowId;
						const isEditing = editing?.rowId === c.rowId;
						const isLoading = loadingId === c.rowId;
						return (
							<tr key={key}>
								<td>{c.titleEn ?? c.titleDe ?? c.moduleId ?? "—"}</td>
								<td>{c.courseName ?? c.courseCode ?? "—"}</td>
								<td>
									{isEditing ? (
										<input
											className="import-table-input"
											style={{ width: 60 }}
											value={editing?.grade}
											onChange={(e) =>
												setEditing((s) => s && { ...s, grade: e.target.value })
											}
										/>
									) : (
										(c.grade ?? "—")
									)}
								</td>
								<td>{c.credits ?? 0}</td>
								<td>
									{isEditing ? (
										<div style={{ display: "flex", gap: 6 }}>
											<button
												type="button"
												className="btn btn-primary"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading}
												onClick={() => handleSave(c)}
											>
												{isLoading ? "Saving..." : "Save"}
											</button>
											<button
												type="button"
												className="btn btn-ghost"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading}
												onClick={() => setEditing(null)}
											>
												Cancel
											</button>
										</div>
									) : (
										<div style={{ display: "flex", gap: 6 }}>
											<button
												type="button"
												className="btn btn-ghost"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading}
												onClick={() => startEdit(c)}
											>
												Edit
											</button>
											<button
												type="button"
												className="btn btn-ghost"
												style={{
													fontSize: 12,
													padding: "4px 10px",
													color: "var(--danger)",
												}}
												disabled={isLoading}
												onClick={() => handleUnmatch(c)}
											>
												{isLoading ? "..." : "Unmatch"}
											</button>
										</div>
									)}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
