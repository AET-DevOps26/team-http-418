import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	aiMatchTranscript,
	resolveImportCourse,
	skipImportCourse,
	unskipImportCourse,
} from "#/api/progress";
import type { CourseSummary } from "#/api/types";
import type { UnmatchedCourse } from "#/hooks/useImportReducer";
import { CourseSearchPopover } from "./CourseSearchPopover";

type Props = {
	unmatched: UnmatchedCourse[];
};

export function UnmatchedTable({ unmatched }: Props) {
	const queryClient = useQueryClient();
	const [resolvingId, setResolvingId] = useState<string | null>(null);
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleSelect(
		unmatchedCourse: UnmatchedCourse,
		course: CourseSummary,
	) {
		const moduleId = unmatchedCourse.module.moduleId ?? "";
		setResolvingId(null);
		setLoadingId(moduleId);
		setError(null);
		try {
			await resolveImportCourse(unmatchedCourse.rowId, Number(course.id));
			queryClient.invalidateQueries({ queryKey: ["importState"] });
		} catch {
			setError("Failed to resolve. Try again.");
		} finally {
			setLoadingId(null);
		}
	}

	async function handleAiResolve(unmatchedCourse: UnmatchedCourse) {
		const moduleId = unmatchedCourse.module.moduleId ?? "";
		setAiLoadingId(moduleId);
		setError(null);
		try {
			const result = await aiMatchTranscript([
				{
					moduleId: unmatchedCourse.module.moduleId ?? "",
					titleEn: unmatchedCourse.module.titleEn,
					titleDe: unmatchedCourse.module.titleDe,
				},
			]);
			const match = result.matches.find(
				(m) => m.moduleId === unmatchedCourse.module.moduleId,
			);
			if (!match) {
				setError(
					`No AI match found for: ${unmatchedCourse.module.titleEn ?? unmatchedCourse.module.moduleId}`,
				);
				return;
			}
			await resolveImportCourse(unmatchedCourse.rowId, Number(match.courseId));
			queryClient.invalidateQueries({ queryKey: ["importState"] });
		} catch {
			setError("AI resolve failed. Try again.");
		} finally {
			setAiLoadingId(null);
		}
	}

	async function handleSkip(unmatchedCourse: UnmatchedCourse) {
		try {
			if (unmatchedCourse.skipped) {
				await unskipImportCourse(unmatchedCourse.rowId);
			} else {
				await skipImportCourse(unmatchedCourse.rowId);
			}
			queryClient.invalidateQueries({ queryKey: ["importState"] });
		} catch {
			setError("Skip failed. Try again.");
		}
	}

	if (unmatched.length === 0) {
		return (
			<div
				style={{
					padding: "32px 0",
					textAlign: "center",
					color: "var(--muted)",
					fontSize: 13,
				}}
			>
				No unmatched courses
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
						<th>Transcript Subject</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{unmatched.map((u) => {
						const id = u.module.moduleId ?? u.originalError;
						const isResolving = resolvingId === u.module.moduleId;
						const isLoading = loadingId === u.module.moduleId;
						const isAiLoading = aiLoadingId === u.module.moduleId;
						return (
							<tr key={id} style={{ opacity: u.skipped ? 0.5 : 1 }}>
								<td
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: 12,
										color: "var(--blue-700)",
									}}
								>
									{u.module.moduleId ?? "—"}
								</td>
								<td>{u.module.titleEn ?? u.module.titleDe ?? "—"}</td>
								<td>
									{u.skipped ? (
										<span
											className="status-tag"
											style={{
												background: "var(--line-soft)",
												color: "var(--muted)",
											}}
										>
											Skipped
										</span>
									) : (
										<span
											className="status-tag"
											style={{ background: "#fff8ec", color: "#b45309" }}
										>
											Unmatched
										</span>
									)}
								</td>
								<td>
									{u.skipped ? (
										<button
											type="button"
											className="btn btn-ghost"
											style={{ fontSize: 12, padding: "4px 10px" }}
											onClick={() => handleSkip(u)}
										>
											Unskip
										</button>
									) : (
										<div
											style={{
												display: "flex",
												gap: 6,
												alignItems: "center",
												position: "relative",
											}}
										>
											<button
												type="button"
												className="btn btn-ghost"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading || isAiLoading}
												onClick={() =>
													setResolvingId(
														isResolving ? null : (u.module.moduleId ?? null),
													)
												}
											>
												{isLoading ? "Resolving..." : "Resolve"}
											</button>
											<button
												type="button"
												className="btn btn-ghost"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading || isAiLoading}
												onClick={() => handleAiResolve(u)}
											>
												{isAiLoading ? "AI..." : "AI Resolve"}
											</button>
											<button
												type="button"
												className="btn btn-ghost"
												style={{ fontSize: 12, padding: "4px 10px" }}
												disabled={isLoading || isAiLoading}
												onClick={() => handleSkip(u)}
											>
												Skip
											</button>
											{isResolving && (
												<CourseSearchPopover
													onSelect={(course) => handleSelect(u, course)}
													onClose={() => setResolvingId(null)}
												/>
											)}
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
