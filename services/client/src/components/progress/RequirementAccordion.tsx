import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { DegreeRequirements } from "#/api/types";

export function RequirementAccordion({
	requirements,
}: {
	requirements: DegreeRequirements;
}) {
	const [open, setOpen] = useState<Set<string>>(new Set());

	function toggle(name: string) {
		setOpen((prev) => {
			const next = new Set(prev);
			if (next.has(name)) next.delete(name);
			else next.add(name);
			return next;
		});
	}

	return (
		<div>
			<div
				style={{
					marginBottom: 16,
					fontSize: 14,
					color: "var(--muted)",
				}}
			>
				{requirements.studyProgram.name} — {requirements.totalCreditsEarned} /{" "}
				{requirements.totalCreditsRequired} ECTS
			</div>

			<div className="card" style={{ overflow: "hidden" }}>
				{requirements.categories.map((cat) => {
					const isOpen = open.has(cat.name);
					return (
						<div key={cat.name}>
							<button
								type="button"
								className="accordion-header"
								onClick={() => toggle(cat.name)}
							>
								{isOpen ? (
									<ChevronDown size={14} />
								) : (
									<ChevronRight size={14} />
								)}
								<span style={{ flex: 1 }}>{cat.name}</span>
								<span
									style={{
										fontSize: 12,
										color: "var(--muted)",
										marginRight: 8,
									}}
								>
									{cat.creditsEarned} / {cat.creditsRequired}
								</span>
								<span
									className={`fulfilled-badge ${cat.fulfilled ? "fulfilled-badge--yes" : "fulfilled-badge--no"}`}
								>
									{cat.fulfilled ? "Fulfilled" : "In Progress"}
								</span>
							</button>
							{isOpen && (
								<div className="accordion-body">
									<table className="progress-table">
										<thead>
											<tr>
												<th>Code</th>
												<th>Course</th>
												<th>Credits</th>
												<th>Status</th>
											</tr>
										</thead>
										<tbody>
											{cat.courses.map((c) => (
												<tr key={c.courseId}>
													<td
														style={{
															fontFamily: "var(--font-mono)",
															fontSize: 12,
														}}
													>
														{c.courseCode}
													</td>
													<td>{c.courseName}</td>
													<td>{c.credits}</td>
													<td>
														<span
															className={`status-tag status-tag--${c.status.toLowerCase()}`}
														>
															{c.status}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{requirements.alerts.length > 0 && (
				<div
					style={{
						marginTop: 16,
						display: "flex",
						flexDirection: "column",
						gap: 8,
					}}
				>
					{requirements.alerts.map((alert) => (
						<div key={alert.message} className="alert-item alert-warn">
							<span style={{ fontSize: 13 }}>{alert.message}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
