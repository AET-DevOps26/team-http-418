import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { GenerateRoadmapModal } from "#/components/roadmap/GenerateRoadmapModal";
import { GeneratingState } from "#/components/roadmap/GeneratingState";
import { RoadmapTimeline } from "#/components/roadmap/RoadmapTimeline";
import {
	useGenerateRoadmap,
	useRemoveCourseFromSemester,
	useRoadmap,
} from "#/hooks/useRoadmap";

export const Route = createFileRoute("/_authenticated/planner")({
	component: Planner,
});

function PlannerSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 24 }}>
				<div
					className="skel"
					style={{ height: 28, width: 200, marginBottom: 8 }}
				/>
				<div className="skel" style={{ height: 16, width: 280 }} />
			</div>
			<div style={{ display: "flex", gap: 20 }}>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<div
						key={i}
						className="card"
						style={{ minWidth: 230, maxWidth: 230, padding: 16 }}
					>
						<div
							className="skel"
							style={{ height: 11, width: 100, marginBottom: 8 }}
						/>
						<div
							className="skel"
							style={{ height: 11, width: 60, marginBottom: 16 }}
						/>
						{[0, 1, 2, 3].map((j) => (
							<div
								key={j}
								className="skel"
								style={{ height: 30, width: "100%", marginBottom: 8 }}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

function Planner() {
	const { data, isLoading, isError, refetch } = useRoadmap();
	const generateMutation = useGenerateRoadmap();
	const removeMutation = useRemoveCourseFromSemester();
	const [modalOpen, setModalOpen] = useState(false);

	if (isLoading) return <PlannerSkeleton />;

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
						Failed to load roadmap data.
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

	if (data.status === "GENERATING") {
		return (
			<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
				<GeneratingState />
			</div>
		);
	}

	if (data.status === "EMPTY") {
		return (
			<div
				className="view-fade"
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p
						style={{
							color: "var(--muted)",
							marginBottom: 16,
							fontSize: 14,
						}}
					>
						No roadmap yet. Let AI plan your path to graduation.
					</p>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => setModalOpen(true)}
					>
						<Sparkles size={14} strokeWidth={2} />
						Generate Roadmap
					</button>
					<GenerateRoadmapModal
						open={modalOpen}
						onClose={() => setModalOpen(false)}
						onSubmit={(req) => generateMutation.mutate(req)}
					/>
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
					<h1
						style={{
							margin: 0,
							fontSize: 24,
							fontWeight: 700,
							color: "var(--ink)",
							lineHeight: 1.2,
						}}
					>
						Semester Planner
					</h1>
					<p
						style={{
							margin: "4px 0 0",
							fontSize: 14,
							color: "var(--muted)",
						}}
					>
						Est. graduation {data.estimatedGraduation} ·{" "}
						{data.totalPlannedCredits} total credits
					</p>
				</div>
				<button
					type="button"
					className="btn btn-primary"
					onClick={() => setModalOpen(true)}
				>
					<Sparkles size={14} strokeWidth={2} />
					Regenerate Roadmap
				</button>
			</div>

			<RoadmapTimeline
				semesters={data.semesters}
				onRemoveCourse={(semesterKey, courseId) =>
					removeMutation.mutate({ semesterKey, courseId })
				}
			/>

			<GenerateRoadmapModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				onSubmit={(req) => generateMutation.mutate(req)}
			/>
		</div>
	);
}
