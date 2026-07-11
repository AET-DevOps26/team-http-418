import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type {CourseDetail, Recommendation} from "#/api/types";
import { InfoBanner } from "#/components/dashboard/InfoBanner";
import {useCourse} from "../../hooks/useCourse";

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
	const details: CourseDetail[] = [];
	top3.forEach((rec) => {
		const { data: course, courseIsLoading, isError } = useCourse<CourseDetail>(rec.courseId);
		details.push(course);
	})
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
						{top3.map((rec, index) => (
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
											{details[index]?.title_en ?? details[index]?.title_ger ?? "N/A"}
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
