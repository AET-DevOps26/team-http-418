import type { Dashboard, DashboardProgress } from "#/api/types";

const MOCK_REQUIREMENTS = [
	{ name: "Core · Informatics", earned: 67, total: 72 },
	{ name: "Electives · Informatics", earned: 6, total: 30 },
	{ name: "Electives · Application", earned: 8, total: 18 },
	{ name: "Mathematics", earned: 5, total: 8 },
];

function ProgressRing({ pct }: { pct: number }) {
	const r = 50;
	const circ = 2 * Math.PI * r;
	const offset = circ * (1 - pct / 100);

	return (
		<svg
			viewBox="0 0 120 120"
			width="120"
			height="120"
			style={{ display: "block" }}
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stopColor="var(--blue-400)" />
					<stop offset="100%" stopColor="var(--blue-900)" />
				</linearGradient>
			</defs>
			<circle
				cx="60"
				cy="60"
				r={r}
				fill="none"
				stroke="var(--line)"
				strokeWidth="9"
			/>
			<circle
				cx="60"
				cy="60"
				r={r}
				fill="none"
				stroke="url(#ring-grad)"
				strokeWidth="9"
				strokeLinecap="round"
				strokeDasharray={`${circ} ${circ}`}
				strokeDashoffset={offset}
				style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
			/>
		</svg>
	);
}

type Props = {
	progress: DashboardProgress;
	requirements?: Dashboard["requirements"];
};

export function DegreeProgress({ progress, requirements }: Props) {
	const reqs = requirements ?? MOCK_REQUIREMENTS;
	const { totalCreditsEarned, totalCreditsRequired, progressPercentage } =
		progress;

	return (
		<div className="card" style={{ padding: "20px", height: "100%" }}>
			<div className="eyebrow">Degree Progress</div>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					position: "relative",
					marginBottom: 20,
				}}
			>
				<ProgressRing pct={progressPercentage} />
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						textAlign: "center",
					}}
				>
					<div
						style={{
							fontSize: 22,
							fontWeight: 700,
							color: "var(--ink)",
							lineHeight: 1,
						}}
					>
						{totalCreditsEarned}
					</div>
					<div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
						of {totalCreditsRequired} ECTS
					</div>
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
				{reqs.map((req) => {
					const pct = Math.min(100, (req.earned / req.total) * 100);
					return (
						<div key={req.name}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "baseline",
									marginBottom: 4,
								}}
							>
								<span
									style={{
										fontSize: 11.5,
										color: "var(--ink-soft)",
										fontWeight: 500,
									}}
								>
									{req.name}
								</span>
								<span
									style={{
										fontSize: 11,
										color: "var(--muted)",
										fontFamily: "var(--font-mono)",
									}}
								>
									{req.earned}/{req.total}
								</span>
							</div>
							<div className="req-bar-track">
								<div className="req-bar-fill" style={{ width: `${pct}%` }} />
							</div>
						</div>
					);
				})}
			</div>

			<button
				type="button"
				className="btn btn-ghost"
				style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
			>
				View full requirement tree
			</button>
		</div>
	);
}
