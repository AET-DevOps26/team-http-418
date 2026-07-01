import type { Dispatch } from "react";
import { useState } from "react";
import { addCompletedCourse, removeCompletedCourse } from "#/api/progress";
import type { ImportAction, ReviewableCourse } from "#/hooks/useImportReducer";

type Props = {
	imported: ReviewableCourse[];
	dispatch: Dispatch<ImportAction>;
};

type EditState = {
	courseId: string;
	grade: string;
};

export function ImportedTable({ imported, dispatch }: Props) {
	const [editing, setEditing] = useState<EditState | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	function startEdit(course: ReviewableCourse) {
		setEditing({
			courseId: course.courseId ?? "",
			grade: course.grade ?? "",
		});
		setError(null);
	}

	async function handleSave(course: ReviewableCourse) {
		if (!editing || !course.courseId) return;
		const newGrade = parseFloat(editing.grade);
		if (Number.isNaN(newGrade)) {
			setError("Invalid grade value.");
			return;
		}
		setLoadingId(course.courseId);
		setError(null);
		try {
			await removeCompletedCourse(course.courseId);
			try {
				const completed = await addCompletedCourse({
					courseId: course.courseId,
					grade: newGrade,
					semester: "",
				});
				dispatch({
					type: "EDIT_COURSE",
					courseId: course.courseId,
					updates: { grade: String(completed.grade) },
				});
				setEditing(null);
			} catch {
				await addCompletedCourse({
					courseId: course.courseId,
					grade: parseFloat(course.grade ?? "0"),
					semester: "",
				}).catch(() => {});
				setError("Save failed. Original grade restored.");
			}
		} catch {
			setError("Save failed. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleUnmatch(course: ReviewableCourse) {
		if (!course.courseId) return;
		setLoadingId(course.courseId);
		setError(null);
		try {
			await removeCompletedCourse(course.courseId);
			dispatch({ type: "UNRESOLVE_COURSE", courseId: course.courseId });
		} catch {
			setError("Unmatch failed. Try again.");
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
						<th>Module ID</th>
						<th>Course Name</th>
						<th>Grade</th>
						<th>Credits</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{imported.map((c) => {
						const key = c.courseId ?? `${c.moduleId}-${c.courseName}`;
						const hasCourseId = c.courseId != null;
						const isEditing = hasCourseId && editing?.courseId === c.courseId;
						const isLoading = hasCourseId && loadingId === c.courseId;
						return (
							<tr key={key}>
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
								<td>{c.credits}</td>
								<td>
									{!hasCourseId ? (
										<span style={{ fontSize: 11.5, color: "var(--muted)" }}>
											Already in DB
										</span>
									) : isEditing ? (
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
