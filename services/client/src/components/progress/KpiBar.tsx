import type { AcademicProgress } from "#/api/types";

export function KpiBar({ progress }: { progress: AcademicProgress }) {
	const items = [
		{
			label: "Credits Earned",
			value: `${progress.totalCreditsEarned} / ${progress.totalCreditsRequired}`,
			sub: "ECTS",
		},
		{
			label: "GPA",
			value: progress.gpa?.toFixed(2) ?? "N/A",
			sub: "Current",
		},
		{
			label: "Progress",
			value:
				progress.progressPercentage != null
					? `${progress.progressPercentage.toFixed(1)}%`
					: "N/A",
			sub: "Toward degree",
		},
		{
			label: "Completed",
			value: String(progress.completedCourseCount),
			sub: "Courses",
		},
		{
			label: "Enrolled",
			value: String(progress.enrolledCourseCount),
			sub: "Current",
		},
	];

	return (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
				gap: 16,
				marginBottom: 24,
			}}
		>
			{items.map((item) => (
				<div key={item.label} className="card" style={{ padding: "16px 18px" }}>
					<div
						style={{
							fontSize: 10.5,
							fontWeight: 600,
							letterSpacing: "0.07em",
							textTransform: "uppercase",
							color: "var(--muted)",
							marginBottom: 6,
						}}
					>
						{item.label}
					</div>
					<div
						style={{
							fontSize: 22,
							fontWeight: 700,
							color: "var(--ink)",
							lineHeight: 1.2,
						}}
					>
						{item.value}
					</div>
					<div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
						{item.sub}
					</div>
				</div>
			))}
		</div>
	);
}
