import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Sparkles } from "lucide-react";
import type { Recommendation, CourseDetail } from "#/api/types";
import { useCourse } from "#/hooks/useCourse.ts";

type Props = { recommendation: Recommendation };

export function RecommendationCard({ recommendation: rec }: Props) {
	const navigate = useNavigate();
	const { data: courseDetail, isLoading, isError, error, fetchStatus, status } = useCourse<CourseDetail>(rec.courseId.toString());
	if (isLoading || !courseDetail) {
		return <div className="rec-card">Loading…</div>; // or a skeleton
	}

	if (isError) {
		return <div className="rec-card">Failed to load course</div>;
	}
	return (
		<button
			type="button"
			className="rec-card"
			style={{
				cursor: "pointer",
				textAlign: "left",
				width: "100%",
				font: "inherit",
			}}
			onClick={() =>
				navigate({ to: "/courses", search: { course: rec.courseId.toString() } })
			}
		>
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
					{courseDetail.title_en ?? courseDetail.title_ger ?? "N/A"}
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

			<div style={{ marginBottom: 10 }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						fontSize: 10,
						fontWeight: 600,
						color: "var(--muted)",
						marginBottom: 4,
					}}
				>
					<span>Relevance</span>
					<span style={{ color: "#5b21b6" }}>
						{Math.round(rec.relevanceScore * 100)}%
					</span>
				</div>
				<div className="relevance-bar-track">
					<div
						className="relevance-bar-fill"
						style={{ width: `${Math.round(rec.relevanceScore * 100)}%` }}
					/>
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

			{rec.tags.length > 0 && (
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 4,
						marginTop: 10,
					}}
				>
					{rec.tags.map((tag) => (
						<span
							key={tag}
							className="tag"
							style={{
								background: "var(--line-soft)",
								color: "var(--ink-soft)",
							}}
						>
							{tag}
						</span>
					))}
				</div>
			)}

			<div
				style={{
					marginTop: 10,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{/*<span*/}
				{/*	className={`prereq-badge${rec.prerequisitesMet ? " prereq-badge--met" : " prereq-badge--missing"}`}*/}
				{/*>*/}
				{/*	{rec.prerequisitesMet ? (*/}
				{/*		<>*/}
				{/*			<CheckCircle size={11} strokeWidth={2} />*/}
				{/*			Prerequisites met*/}
				{/*		</>*/}
				{/*	) : (*/}
				{/*		<>*/}
				{/*			<span style={{ fontSize: 11 }}>⚠</span>*/}
				{/*			Prerequisites missing*/}
				{/*		</>*/}
				{/*	)}*/}
				{/*</span>*/}
			</div>
		</button>
	);
}
