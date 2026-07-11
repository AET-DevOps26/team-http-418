import { Link } from "@tanstack/react-router";
import type { Recommendation } from "#/api/types";
import { InfoBanner } from "#/components/dashboard/InfoBanner";
import { RecommendationPreviewCard } from "#/components/dashboard/RecommendationPreviewCard";

type Props = {
	recommendations?: Recommendation[];
	isLoading: boolean;
	hasGoalsOrInterests: boolean;
	onGenerate?: () => void;
};

export function RecommendationPreview({
	recommendations,
	isLoading,
	hasGoalsOrInterests,
	onGenerate,
}: Props) {
	const top3 = recommendations?.slice(0, 3) ?? [];
	const header = (
		<div
			className="eyebrow"
			style={{ display: "flex", alignItems: "center", gap: 6 }}
		>
			<span
				style={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					background: "#7c3aed",
					display: "inline-block",
					flexShrink: 0,
				}}
			/>
			AI-personalised recommendations
		</div>
	);

	if (isLoading) {
		return (
			<div className="card" style={{ padding: "20px" }}>
				{header}
				<div className="rec-row">
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							style={{
								border: "1px solid var(--line)",
								borderRadius: "var(--r-lg)",
								padding: 14,
							}}
						>
							<div
								className="skel"
								style={{ height: 16, width: 60, marginBottom: 8 }}
							/>
							<div
								className="skel"
								style={{ height: 13, width: "90%", marginBottom: 4 }}
							/>
							<div
								className="skel"
								style={{
									height: 40,
									width: "100%",
									marginTop: 8,
									borderRadius: "var(--r-sm)",
								}}
							/>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="card" style={{ padding: "20px" }}>
			{header}

			{!hasGoalsOrInterests ? (
				<InfoBanner
					title="Add interests for personalized recommendations"
					description="Tell us your goals and interests so AIDAN can suggest the right courses for you."
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
			) : top3.length === 0 ? (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: 10,
						padding: "20px 0",
					}}
				>
					<p
						style={{
							fontSize: 13,
							color: "var(--muted)",
							margin: 0,
							textAlign: "center",
						}}
					>
						No recommendations yet.
					</p>
					{onGenerate && (
						<button
							type="button"
							className="btn btn-primary"
							style={{ fontSize: 12 }}
							onClick={onGenerate}
						>
							Generate recommendations
						</button>
					)}
				</div>
			) : (
				<>
					<div className="rec-row">
						{top3.map((rec) => (
							<RecommendationPreviewCard
								key={rec.courseId}
								recommendation={rec}
							/>
						))}
					</div>
					<div
						style={{
							marginTop: 12,
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<Link
							to="/courses"
							className="btn btn-ghost"
							style={{ fontSize: 11, padding: "3px 8px" }}
						>
							Browse all →
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
