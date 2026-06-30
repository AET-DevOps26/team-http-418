import { createFileRoute } from "@tanstack/react-router";
import { AlertsList } from "#/components/dashboard/AlertsList";
import { CurrentCourses } from "#/components/dashboard/CurrentCourses";
import { DegreeProgress } from "#/components/dashboard/DegreeProgress";
import { KpiStrip } from "#/components/dashboard/KpiStrip";
import { RecommendationPreview } from "#/components/dashboard/RecommendationPreview";
import { useDashboard } from "#/hooks/useDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function DashboardSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 24 }}>
				<div
					className="skel"
					style={{ height: 28, width: 220, marginBottom: 8 }}
				/>
				<div className="skel" style={{ height: 16, width: 160 }} />
			</div>

			<div className="grid grid-cols-4 gap-5" style={{ marginBottom: 24 }}>
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="card" style={{ padding: "18px 20px" }}>
						<div
							className="skel"
							style={{ height: 11, width: 80, marginBottom: 8 }}
						/>
						<div
							className="skel"
							style={{ height: 28, width: 60, marginBottom: 4 }}
						/>
						<div className="skel" style={{ height: 11, width: 100 }} />
					</div>
				))}
			</div>

			<div className="dash-grid">
				<div
					className="card col-span-4 row-span-2"
					style={{ padding: 20, minHeight: 360 }}
				>
					<div
						className="skel"
						style={{ height: 11, width: 100, marginBottom: 20 }}
					/>
					<div
						className="skel"
						style={{
							height: 120,
							width: 120,
							borderRadius: "50%",
							margin: "0 auto 20px",
						}}
					/>
					{[0, 1, 2, 3].map((i) => (
						<div key={i} style={{ marginBottom: 12 }}>
							<div
								className="skel"
								style={{ height: 10, width: "80%", marginBottom: 6 }}
							/>
							<div className="skel" style={{ height: 5, width: "100%" }} />
						</div>
					))}
				</div>

				<div className="card col-span-8" style={{ padding: 20 }}>
					<div
						className="skel"
						style={{ height: 11, width: 160, marginBottom: 20 }}
					/>
					<div className="grid grid-cols-3 gap-4">
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

				<div className="card col-span-5" style={{ padding: 20 }}>
					<div
						className="skel"
						style={{ height: 11, width: 120, marginBottom: 16 }}
					/>
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							style={{
								paddingBottom: 12,
								borderBottom: i < 2 ? "1px solid var(--line-soft)" : "none",
								marginBottom: i < 2 ? 12 : 0,
							}}
						>
							<div
								className="skel"
								style={{ height: 13, width: "70%", marginBottom: 6 }}
							/>
							<div className="skel" style={{ height: 11, width: "50%" }} />
						</div>
					))}
				</div>

				<div className="card col-span-3" style={{ padding: 20 }}>
					<div
						className="skel"
						style={{ height: 11, width: 100, marginBottom: 16 }}
					/>
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							style={{
								padding: "10px 12px",
								borderRadius: "var(--r-md)",
								background: "var(--line-soft)",
								marginBottom: 8,
							}}
						>
							<div
								className="skel"
								style={{ height: 11, width: "60%", marginBottom: 6 }}
							/>
							<div className="skel" style={{ height: 11, width: "90%" }} />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function Dashboard() {
	const { data, isLoading, isError, refetch } = useDashboard();

	if (isLoading) return <DashboardSkeleton />;

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
						Failed to load dashboard data.
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
			<div style={{ marginBottom: 24 }}>
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
					Good morning — here's your overview
				</h1>
				<p
					style={{
						margin: "4px 0 0",
						fontSize: 14,
						color: "var(--muted)",
					}}
				>
					{data.progress.currentSemester} ·{" "}
					{data.progress.progressPercentage?.toFixed(1)}% toward your degree
				</p>
			</div>

			<KpiStrip
				progress={data.progress}
				semesterCredits={data.semesterCredits}
				alerts={data.alerts}
			/>

			<div className="dash-grid">
				<div className="col-span-4 row-span-2">
					<DegreeProgress
						progress={data.progress}
						requirements={data.requirements}
					/>
				</div>

				<div className="col-span-8">
					<RecommendationPreview recommendations={data.recommendations} />
				</div>

				<div className="col-span-5">
					<CurrentCourses
						courses={data.upcomingCourses}
						semester={data.progress.currentSemester}
					/>
				</div>

				<div className="col-span-3">
					<AlertsList alerts={data.alerts} />
				</div>
			</div>
		</div>
	);
}
