import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { DashboardRecommendation } from "#/api/types";

type Props = { recommendations: DashboardRecommendation[] };

export function RecommendationPreview({ recommendations }: Props) {
	const top3 = recommendations.slice(0, 3);

	return (
		<div className="card" style={{ padding: "20px" }}>
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

			{top3.length === 0 ? (
				<p style={{ fontSize: 13, color: "var(--muted)" }}>
					No recommendations available.
				</p>
			) : (
				<div className="rec-row">
					{top3.map((rec) => (
						<Link
							key={rec.courseId}
							to="/courses"
							search={{ course: rec.courseId }}
							style={{ textDecoration: "none", display: "flex" }}
						>
							<div className="rec-card">
								<div style={{ marginBottom: 8 }}>
									<span
										className="tag"
										style={{
											background: "var(--blue-50)",
											color: "var(--blue-700)",
											fontFamily: "var(--font-mono)",
											marginBottom: 6,
											display: "inline-flex",
										}}
									>
										{rec?.courseCode ?? "N/A"}
									</span>
									<div
										style={{
											fontSize: 13,
											fontWeight: 600,
											color: "var(--ink)",
											lineHeight: 1.3,
										}}
									>
										{rec.courseName}
									</div>
								</div>

								<div className="ai-reason" style={{ flex: 1 }}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 4,
											marginBottom: 3,
											fontSize: 10,
											fontWeight: 700,
											letterSpacing: "0.05em",
											textTransform: "uppercase",
											color: "#7c3aed",
										}}
									>
										<Sparkles size={10} strokeWidth={2} />
										Why AIDAN recommends this
									</div>
									{rec.reason}
								</div>

								<div
									style={{
										marginTop: 10,
										display: "flex",
										justifyContent: "flex-end",
									}}
								>
									<span
										style={{
											fontSize: 11,
											fontWeight: 600,
											color: "#5b21b6",
											background: "#ede9fe",
											borderRadius: "var(--r-sm)",
											padding: "2px 7px",
										}}
									>
										{Math.round(rec.relevanceScore * 100)}% match
									</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
