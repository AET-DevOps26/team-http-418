import type { DashboardAlert, DashboardProgress } from "#/api/types";

type Props = {
	progress: DashboardProgress;
	semesterCredits: number;
	alerts: DashboardAlert[];
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

export function KpiStrip({ progress, semesterCredits, alerts }: Props) {
	const { totalCreditsEarned, totalCreditsRequired, gpa } = progress;

	return (
		<div className="grid grid-cols-4 gap-5" style={{ marginBottom: 24 }}>
			<KpiCard
				label="Credits Earned"
				value={totalCreditsEarned}
				sub={`of ${totalCreditsRequired} ECTS required`}
			/>
			<KpiCard
				label="This Semester"
				value={semesterCredits}
				sub="ECTS enrolled"
			/>
			<KpiCard label="GPA" value={gpa?.toFixed(2)} sub="cumulative" />
			<KpiCard
				label="Active Alerts"
				value={alerts.length}
				sub={`${alerts.filter((a) => a.severity === "ERROR").length} critical`}
				ai
			/>
		</div>
	);
}
