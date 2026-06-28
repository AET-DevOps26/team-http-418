import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ConflictBanner } from "#/components/schedule/ConflictBanner";
import { SemesterSelector } from "#/components/schedule/SemesterSelector";
import { WeekGrid } from "#/components/schedule/WeekGrid";
import { useSchedule } from "#/hooks/useSchedule";

export const Route = createFileRoute("/_authenticated/schedule")({
	component: Schedule,
});

function ScheduleSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 20,
				}}
			>
				<div>
					<div
						className="skel"
						style={{ height: 28, width: 200, marginBottom: 8 }}
					/>
					<div className="skel" style={{ height: 14, width: 140 }} />
				</div>
				<div className="skel" style={{ height: 34, width: 100 }} />
			</div>
			<div
				className="skel"
				style={{ height: 500, width: "100%", borderRadius: "var(--r-xl)" }}
			/>
		</div>
	);
}

function Schedule() {
	const [semester, setSemester] = useState<string | undefined>();
	const [bannerDismissed, setBannerDismissed] = useState(false);
	const { data, isLoading, isError, refetch } = useSchedule(semester);

	if (isLoading) return <ScheduleSkeleton />;

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
						Failed to load schedule.
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
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 20,
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
						Weekly Schedule
					</h1>
					<p
						style={{
							margin: "4px 0 0",
							fontSize: 14,
							color: "var(--muted)",
						}}
					>
						{data.semester} · {data.totalCredits} credits
					</p>
				</div>
				<SemesterSelector
					value={semester ?? data.semester}
					onChange={setSemester}
				/>
			</div>

			{!bannerDismissed && data.conflicts.length > 0 && (
				<ConflictBanner
					conflicts={data.conflicts}
					onDismiss={() => setBannerDismissed(true)}
				/>
			)}

			{data.events.length === 0 ? (
				<div
					className="card"
					style={{
						padding: 40,
						textAlign: "center",
					}}
				>
					<p
						style={{
							color: "var(--muted)",
							fontSize: 14,
							marginBottom: 12,
						}}
					>
						No courses enrolled for this semester.
					</p>
					<a href="/courses" className="btn btn-primary">
						Browse courses
					</a>
				</div>
			) : (
				<WeekGrid events={data.events} />
			)}
		</div>
	);
}
