import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import type { AcademicProgress, DegreeRequirements } from "#/api/types";
import { InfoBanner } from "#/components/dashboard/InfoBanner";

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
	progress?: AcademicProgress;
	requirements?: DegreeRequirements;
	hasTranscript: boolean;
	hasStudyProgram: boolean;
};

export function DegreeProgress({
	progress,
	requirements,
	hasTranscript,
	hasStudyProgram,
}: Props) {
	const totalCreditsEarned = progress?.totalCreditsEarned ?? 0;
	const creditsRequired = progress?.totalCreditsRequired ?? 0;
	const progressPct = progress?.progressPercentage ?? 0;

	if (!hasTranscript) {
		return (
			<div className="card" style={{ padding: "20px", height: "100%" }}>
				<div className="eyebrow">Degree Progress</div>
				<InfoBanner
					icon={<Info size={16} />}
					title="Upload your transcript to track progress"
					description="Import your academic history so we can calculate your progress toward your degree."
					action={
						<Link
							to="/progress"
							className="btn btn-primary"
							style={{
								fontSize: 12,
								padding: "5px 12px",
								display: "inline-flex",
							}}
						>
							Upload transcript
						</Link>
					}
				/>
			</div>
		);
	}

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
				<ProgressRing pct={progressPct} />
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
						of {creditsRequired} ECTS
					</div>
				</div>
			</div>

			{!hasStudyProgram ? (
				<InfoBanner
					icon={<Info size={16} />}
					title="Select a study program"
					description="Choose your study program to see detailed requirement breakdowns."
					action={
						<Link
							to="/profile"
							className="btn btn-primary"
							style={{
								fontSize: 12,
								padding: "5px 12px",
								display: "inline-flex",
							}}
						>
							Update profile
						</Link>
					}
				/>
			) : requirements?.categories?.length ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
					{requirements.categories.map((cat) => {
						const pct = Math.min(
							100,
							(cat.creditsEarned / cat.creditsRequired) * 100,
						);
						return (
							<div key={cat.name}>
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
										{cat.name}
									</span>
									<span
										style={{
											fontSize: 11,
											color: "var(--muted)",
											fontFamily: "var(--font-mono)",
										}}
									>
										{cat.creditsEarned}/{cat.creditsRequired}
									</span>
								</div>
								<div className="req-bar-track">
									<div className="req-bar-fill" style={{ width: `${pct}%` }} />
								</div>
							</div>
						);
					})}
				</div>
			) : null}

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
