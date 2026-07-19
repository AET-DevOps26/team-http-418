import type { AcademicProgress } from "#/api/types";

type Props = {
	progress: AcademicProgress;
	creditsRequired: number;
};

type KpiCardProps = {
	label: string;
	value: string | number;
	sub?: string;
	ai?: boolean;
};

function KpiCard({ label, value, sub, ai }: KpiCardProps) {
	return (
		<div
			className={`card${ai ? " kpi-ai" : ""}`}
			style={{ padding: "18px 20px" }}
		>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: "0.06em",
					textTransform: "uppercase",
					color: ai ? "rgba(255,255,255,.65)" : "var(--muted)",
					marginBottom: 6,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: 26,
					fontWeight: 700,
					lineHeight: 1.1,
					color: ai ? "#fff" : "var(--ink)",
				}}
			>
				{value}
			</div>
			{sub && (
				<div
					style={{
						fontSize: 12,
						color: ai ? "rgba(255,255,255,.6)" : "var(--muted)",
						marginTop: 3,
					}}
				>
					{sub}
				</div>
			)}
		</div>
	);
}

export function KpiStrip({ progress, creditsRequired }: Props) {
	const { totalCreditsEarned, gpa, enrolledCourseCount } = progress;
	const remaining = Math.max(0, creditsRequired - totalCreditsEarned);

	return (
		<div className="grid grid-cols-4 gap-5" style={{ marginBottom: 24 }}>
			<KpiCard
				label="Credits Earned"
				value={totalCreditsEarned}
				sub={`of ${creditsRequired} ECTS required`}
			/>
			<KpiCard
				label="This Semester"
				value={enrolledCourseCount}
				sub="courses enrolled"
			/>
			<KpiCard
				label="GPA"
				value={gpa != null ? gpa.toFixed(2) : "—"}
				sub="cumulative"
			/>
			<KpiCard label="Remaining" value={remaining} sub="ECTS to complete" ai />
		</div>
	);
}
