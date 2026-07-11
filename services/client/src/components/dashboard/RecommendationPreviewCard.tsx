import { Sparkles } from "lucide-react";
import type { CourseDetail, Recommendation } from "#/api/types";
import { useCourse } from "#/hooks/useCourse";
import { Link } from "@tanstack/react-router";

type RecommendationCardProps = {
	recommendation: Recommendation;
};

export function RecommendationPreviewCard({
	recommendation,
}: RecommendationCardProps) {
	const {
		data: course,
		isLoading,
		isError,
	} = useCourse<CourseDetail>(recommendation.courseId);

	if (isLoading) {
		return <div className="rec-card">Loading...</div>;
	}

	if (isError || !course) {
		return null;
	}

	return (
		<Link
			to="/courses"
			search={{ course: recommendation.courseId }}
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
						{course.title_en ?? course.title_ger ?? "N/A"}
					</span>

					<div
						style={{
							fontSize: 13,
							fontWeight: 600,
							color: "var(--ink)",
							lineHeight: 1.3,
						}}
					>
						{recommendation.courseName}
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

					{recommendation.reason}
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
						{Math.round(recommendation.relevanceScore * 100)}% match
					</span>
				</div>
			</div>
		</Link>
	);
}
