import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { CompletedCourse, EnrolledCourse } from "#/api/types";
import { AddCourseForm } from "#/components/progress/AddCourseForm";
import { CourseTable } from "#/components/progress/CourseTable";
import { CreditsByCategory } from "#/components/progress/CreditsByCategory";
import { EnrollCourseForm } from "#/components/progress/EnrollCourseForm";
import { KpiBar } from "#/components/progress/KpiBar";
import {
	type ProgressTab,
	ProgressTabs,
} from "#/components/progress/ProgressTabs";
import { RequirementAccordion } from "#/components/progress/RequirementAccordion";
import { useToast } from "#/components/ui/Toast";
import {
	useCompletedCourses,
	useDropCourse,
	useEnrolledCourses,
	useProgress,
	useRemoveCompletedCourse,
	useRequirements,
} from "#/hooks/useProgress";

export const Route = createFileRoute("/_authenticated/progress")({
	component: Progress,
});

function ProgressSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 24 }}>
				<div
					className="skel"
					style={{ height: 28, width: 260, marginBottom: 8 }}
				/>
				<div className="skel" style={{ height: 16, width: 160 }} />
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
					gap: 16,
					marginBottom: 24,
				}}
			>
				{[0, 1, 2, 3, 4].map((i) => (
					<div key={i} className="card" style={{ padding: "16px 18px" }}>
						<div
							className="skel"
							style={{ height: 11, width: 80, marginBottom: 8 }}
						/>
						<div
							className="skel"
							style={{ height: 24, width: 60, marginBottom: 4 }}
						/>
						<div className="skel" style={{ height: 11, width: 50 }} />
					</div>
				))}
			</div>
			<div
				className="skel"
				style={{ height: 36, width: 300, marginBottom: 20 }}
			/>
			<div className="card" style={{ padding: 20, minHeight: 200 }}>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="skel"
						style={{ height: 14, marginBottom: 12, width: `${80 - i * 10}%` }}
					/>
				))}
			</div>
		</div>
	);
}

function Progress() {
	const { data: progress, isLoading, isError, refetch } = useProgress();
	const [tab, setTab] = useState<ProgressTab>("Overview");
	const [completedPage, setCompletedPage] = useState(0);
	const [enrolledPage, setEnrolledPage] = useState(0);

	const completedCourses = useCompletedCourses(completedPage, 10);
	const enrolledCourses = useEnrolledCourses(enrolledPage, 10);
	const requirements = useRequirements();
	const removeCourse = useRemoveCompletedCourse();
	const dropCourse = useDropCourse();
	const { toast } = useToast();

	if (isLoading) return <ProgressSkeleton />;

	if (isError || !progress) {
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
						Failed to load academic progress.
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
				<h1
					style={{
						margin: 0,
						fontSize: 24,
						fontWeight: 700,
						color: "var(--ink)",
						lineHeight: 1.2,
					}}
				>
					Academic Progress
				</h1>
				<p
					style={{
						margin: "4px 0 0",
						fontSize: 14,
						color: "var(--muted)",
					}}
				>
					{progress.currentSemester} · {progress.progressPercentage.toFixed(1)}%
					toward your degree
				</p>
			</div>

			<KpiBar progress={progress} />

			<ProgressTabs active={tab} onChange={setTab} />

			{tab === "Overview" && (
				<CreditsByCategory categories={progress.creditsByCategory} />
			)}

			{tab === "Completed" && (
				<div className="card" style={{ padding: 20 }}>
					<div className="eyebrow">Completed Courses</div>
					<AddCourseForm />
					<CourseTable<CompletedCourse>
						page={completedCourses.data}
						isLoading={completedCourses.isLoading}
						rowKey={(r) => r.courseId}
						pageNum={completedPage}
						onPageChange={setCompletedPage}
						isRemoving={removeCourse.isPending}
						removeLabel="Remove"
						onRemove={(row) => {
							const goBackAfterRemove =
								completedPage > 0 &&
								completedCourses.data?.content.length === 1;
							removeCourse.mutate(row.courseId, {
								onSuccess: () => {
									if (goBackAfterRemove) {
										setCompletedPage((page) => Math.max(0, page - 1));
									}
									toast("Course removed", "success");
								},
								onError: () => toast("Failed to remove course", "error"),
							});
						}}
						columns={[
							{
								label: "Code",
								render: (r) => (
									<span
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: 12,
										}}
									>
										{r.courseCode}
									</span>
								),
							},
							{ label: "Name", render: (r) => r.courseName },
							{ label: "Credits", render: (r) => r.credits },
							{ label: "Grade", render: (r) => r.grade.toFixed(1) },
							{ label: "Semester", render: (r) => r.semester },
							{ label: "Category", render: (r) => r.category },
						]}
					/>
				</div>
			)}

			{tab === "Enrolled" && (
				<div className="card" style={{ padding: 20 }}>
					<div className="eyebrow">Enrolled Courses</div>
					<EnrollCourseForm />
					<CourseTable<EnrolledCourse>
						page={enrolledCourses.data}
						isLoading={enrolledCourses.isLoading}
						rowKey={(r) => r.courseId}
						pageNum={enrolledPage}
						onPageChange={setEnrolledPage}
						isRemoving={dropCourse.isPending}
						removeLabel="Drop"
						onRemove={(row) => {
							const goBackAfterDrop =
								enrolledPage > 0 && enrolledCourses.data?.content.length === 1;
							dropCourse.mutate(row.courseId, {
								onSuccess: () => {
									if (goBackAfterDrop) {
										setEnrolledPage((page) => Math.max(0, page - 1));
									}
									toast("Course dropped", "success");
								},
								onError: () => toast("Failed to drop course", "error"),
							});
						}}
						columns={[
							{
								label: "Code",
								render: (r) => (
									<span
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: 12,
										}}
									>
										{r.courseCode}
									</span>
								),
							},
							{ label: "Name", render: (r) => r.courseName },
							{ label: "Credits", render: (r) => r.credits },
							{ label: "Semester", render: (r) => r.semester },
							{
								label: "Schedule",
								render: (r) =>
									r.schedule.map((s) => `${s.day} ${s.startTime}`).join(", "),
							},
						]}
					/>
				</div>
			)}

			{tab === "Requirements" &&
				(requirements.isLoading ? (
					<div style={{ padding: 20 }}>
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="skel"
								style={{
									height: 16,
									marginBottom: 12,
									width: `${80 - i * 10}%`,
								}}
							/>
						))}
					</div>
				) : requirements.data ? (
					<RequirementAccordion requirements={requirements.data} />
				) : (
					<div
						style={{
							padding: 40,
							textAlign: "center",
							color: "var(--muted)",
							fontSize: 14,
						}}
					>
						Could not load requirements.
					</div>
				))}
		</div>
	);
}
