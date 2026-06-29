import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GenerateForm } from "#/components/recommendations/GenerateForm";
import { RecommendationCard } from "#/components/recommendations/RecommendationCard";
import { RecommendationFilters } from "#/components/recommendations/RecommendationFilters";
import {
	useGenerateRecommendations,
	useRecommendations,
} from "#/hooks/useRecommendations";

export const Route = createFileRoute("/_authenticated/recommendations")({
	component: RecommendationsPage,
});

function RecommendationsSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 24 }}>
				<div
					className="skel"
					style={{ height: 28, width: 260, marginBottom: 8 }}
				/>
				<div className="skel" style={{ height: 16, width: 200 }} />
			</div>
			<div className="rec-grid">
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="card" style={{ padding: 16, minHeight: 200 }}>
						<div
							className="skel"
							style={{ height: 16, width: 70, marginBottom: 8 }}
						/>
						<div
							className="skel"
							style={{ height: 14, width: "80%", marginBottom: 12 }}
						/>
						<div
							className="skel"
							style={{ height: 5, width: "100%", marginBottom: 16 }}
						/>
						<div
							className="skel"
							style={{ height: 60, width: "100%", marginBottom: 12 }}
						/>
						<div style={{ display: "flex", gap: 6 }}>
							<div className="skel" style={{ height: 20, width: 60 }} />
							<div className="skel" style={{ height: 20, width: 60 }} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function RecommendationsPage() {
	const [showForm, setShowForm] = useState(false);
	const [filters, setFilters] = useState({ category: "", semester: "" });

	const params = {
		...(filters.category ? { category: filters.category } : {}),
		...(filters.semester ? { semester: filters.semester } : {}),
	};

	const { data, isLoading, isError, refetch } = useRecommendations(
		Object.keys(params).length > 0 ? params : undefined,
	);
	const mutation = useGenerateRecommendations();

	if (isLoading) return <RecommendationsSkeleton />;

	if (isError || !data) {
		return (
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p style={{ color: "var(--muted)", marginBottom: 12, fontSize: 14 }}>
						Failed to load recommendations.
					</p>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => refetch()}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					marginBottom: 24,
				}}
			>
				<div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginBottom: 4,
						}}
					>
						<span
							style={{
								fontSize: 10,
								fontWeight: 700,
								letterSpacing: "0.07em",
								textTransform: "uppercase",
								background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
								color: "#fff",
								padding: "2px 8px",
								borderRadius: "var(--r-sm)",
							}}
						>
							AI-Powered
						</span>
					</div>
					<h1
						style={{
							margin: 0,
							fontSize: 24,
							fontWeight: 700,
							color: "var(--ink)",
							lineHeight: 1.2,
						}}
					>
						AI Recommendations
					</h1>
					<p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--muted)" }}>
						Personalised course suggestions based on your degree progress and
						goals
					</p>
				</div>

				<button
					type="button"
					className="btn btn-ghost"
					style={{ flexShrink: 0 }}
					onClick={() => setShowForm((v) => !v)}
				>
					<Sparkles size={14} strokeWidth={2} />
					{showForm ? "Hide form" : "Refresh with context"}
				</button>
			</div>

			{showForm && <GenerateForm mutation={mutation} />}

			<RecommendationFilters filters={filters} onChange={setFilters} />

			{data.recommendations.length === 0 ? (
				<div
					style={{
						textAlign: "center",
						padding: "60px 0",
						color: "var(--muted)",
						fontSize: 14,
					}}
				>
					No recommendations match your current filters.
				</div>
			) : (
				<div className="rec-grid">
					{data.recommendations.map((rec) => (
						<RecommendationCard key={rec.courseId} recommendation={rec} />
					))}
				</div>
			)}
		</div>
	);
}
