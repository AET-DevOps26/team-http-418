import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { RoadmapCanvas } from "#/components/roadmap/RoadmapCanvas";
import { useGenerateRoadmap, useRoadmap } from "#/hooks/useRoadmap";

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

	const hasPreviousRoadmap = data.semesters.length > 0;

	if (data.status === "GENERATING" && !hasPreviousRoadmap) {
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
						disabled={generateMutation.isPending}
						onClick={() => generateMutation.mutate()}
					>
						<Sparkles size={14} strokeWidth={2} />
						Generate Roadmap
					</button>
				</div>
			</div>
		);
	}

	if (data.status === "ERROR" && !hasPreviousRoadmap) {
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
					<p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 14 }}>
						We could not generate a roadmap. Please try again.
					</p>
					<button
						type="button"
						className="btn btn-primary"
						disabled={generateMutation.isPending}
						onClick={() => generateMutation.mutate()}
					>
						<Sparkles size={14} strokeWidth={2} />
						Retry
					</button>
				</div>
			</div>
		);
	}

	const header = (
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
				disabled={generateMutation.isPending || data.status === "GENERATING"}
				onClick={() => generateMutation.mutate()}
			>
				<Sparkles size={14} strokeWidth={2} />
				{data.status === "ERROR" ? "Retry" : "Regenerate"}
			</button>
		</div>
	);

	return (
		<div
			className="view-fade"
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				padding: "28px 28px 0",
			}}
		>
			{header}
			{data.status === "GENERATING" && (
				<div className="rmc-prereq-badge">
					Generating an updated roadmap. Your current plan remains available.
				</div>
			)}
			{data.status === "ERROR" && (
				<div className="rmc-prereq-badge rmc-prereq-badge--error" role="alert">
					Regeneration failed. Your previous roadmap is still available; retry
					when ready.
				</div>
			)}
			<RoadmapCanvas semesters={data.semesters} />
		</div>
	);
}

function GeneratingState() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: 300,
				gap: 16,
			}}
		>
			<div className="spinner" />
			<p style={{ color: "var(--muted)", fontSize: 14 }}>
				Generating your roadmap…
			</p>
		</div>
	);
}
