// import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { isAuthenticated } from "#/api";
import type { CourseDetail } from "#/api/types";
import { PrerequisiteTree } from "#/components/courses/PrerequisiteTree";
import { ScheduleTable } from "#/components/courses/ScheduleTable";
import { useCourse } from "#/hooks/useCourse";
import { usePrerequisiteCheck } from "#/hooks/usePrerequisiteCheck";
import { usePrerequisiteTree } from "#/hooks/usePrerequisiteTree";

type Props = {
	courseId: string;
	onClose: () => void;
};

export function CourseDetailSheet({ courseId, onClose }: Props) {
	const {
		data: course,
		isLoading,
		isError,
	} = useCourse<CourseDetail>(courseId);
	const { data: prereqTree } = usePrerequisiteTree(courseId);
	const { data: prereqCheck } = usePrerequisiteCheck(courseId);
	const authed = isAuthenticated();
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);
	if (isLoading || !course) {
		return <div className="rec-card">Loading…</div>; // or a skeleton
	}

	if (isError) {
		return <div className="rec-card">Failed to load course</div>;
	}

	const metIds = prereqCheck
		? new Set(prereqCheck.metPrerequisites.map((r) => r.courseId))
		: undefined;
	const unmetIds = prereqCheck
		? new Set(prereqCheck.unmetPrerequisites.map((r) => r.courseId))
		: undefined;

	return (
		<>
			<button
				type="button"
				className="catalog-sheet-overlay"
				onClick={onClose}
				aria-label="Close course detail"
			/>
			<div className="catalog-sheet-panel">
				<button
					type="button"
					className="catalog-sheet-close"
					onClick={onClose}
					aria-label="Close"
				>
					<X size={16} strokeWidth={1.75} />
				</button>

				{isLoading && (
					<div style={{ padding: "32px 24px" }}>
						{(["title", "dept", "desc", "a", "b", "c"] as const).map(
							(id, i) => (
								<div
									key={id}
									className="skel"
									style={{
										height: i === 0 ? 22 : 14,
										width: [200, 140, 160, 80, 80, 80][i],
										marginBottom: 12,
									}}
								/>
							),
						)}
					</div>
				)}

				{isError && (
					<div style={{ padding: "32px 24px", textAlign: "center" }}>
						<p style={{ color: "var(--muted)", fontSize: 14 }}>
							Failed to load course.
						</p>
					</div>
				)}

				{course && (
					<div className="catalog-sheet-content">
						<div style={{ marginBottom: 16 }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: 8,
									marginBottom: 6,
								}}
							>
								<span
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: 13,
										color: "var(--blue-700)",
										fontWeight: 600,
									}}
								>
									{course.title_en ?? course.title_ger ?? "N/A"}
								</span>
								<span
									className="tag"
									style={{
										background: "var(--blue-50)",
										color: "var(--blue-700)",
									}}
								>
									{course.course_type}
								</span>
								<span
									className="tag"
									style={{
										background: "var(--canvas-2)",
										color: "var(--ink-soft)",
									}}
								></span>
								<span
									className="tag"
									style={{
										background: "var(--line-soft)",
										color: "var(--muted)",
									}}
								>
									{course.sws} SWS
								</span>
							</div>
							<h2 className="catalog-sheet-title">{course.name}</h2>
							<p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
								{course.org_name_en}
								<br />
								{course.org_url && (
									<a
										style={{ color: "blue", textDecoration: "underline" }}
										href={course.org_url}
									>
										Chair Homepage
									</a>
								)}
							</p>
						</div>

						{authed && prereqCheck && (
							<div
								className={`catalog-eligibility-badge ${prereqCheck.eligible ? "catalog-eligibility-badge--eligible" : "catalog-eligibility-badge--ineligible"}`}
							>
								{prereqCheck.eligible ? (
									<span>Eligible to enroll</span>
								) : (
									<span>
										Unmet prerequisites:{" "}
										{prereqCheck.unmetPrerequisites
											.map((r) => r?.courseCode ?? "N/A")
											.join(", ")}
									</span>
								)}
							</div>
						)}

						<section className="catalog-sheet-section">
							<p className="eyebrow">Description</p>
							<p
								style={{
									fontSize: 13,
									lineHeight: 1.6,
									color: "var(--ink-soft)",
									margin: 0,
									whiteSpace: "pre-line",
								}}
							>
								{course.description_en ?? course.description_ger ?? "N/A"}
							</p>
						</section>

						{(course.previous_knowledge_en ??
							course.previous_knowledge_ger) && (
							<section className="catalog-sheet-section">
								<p className="eyebrow">Requirements</p>
								<p
									style={{
										fontSize: 13,
										lineHeight: 1.6,
										color: "var(--ink-soft)",
										margin: 0,
										whiteSpace: "pre-line",
									}}
								>
									{course.previous_knowledge_en ??
										course.previous_knowledge_ger}
								</p>
							</section>
						)}

						{course.people?.length > 0 && (
							<section className="catalog-sheet-section">
								<p className="eyebrow">Instructors</p>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 6 }}
								>
									{course.people.map((inst) => (
										<div key={inst.last_name} style={{ fontSize: 13 }}>
											<span style={{ color: "var(--ink)", fontWeight: 500 }}>
												{inst.teaching_function}: {inst.last_name},{" "}
												{inst.first_name}
											</span>
											{/*{inst.email && (*/}
											{/*	<span style={{ color: "var(--muted)", marginLeft: 8 }}>*/}
											{/*		{inst.email}*/}
											{/*	</span>*/}
											{/*)}*/}
										</div>
									))}
								</div>
							</section>
						)}

						<section className="catalog-sheet-section">
							<p className="eyebrow">Schedule</p>
							<ScheduleTable slots={course.appointments} />
						</section>

						{prereqTree && prereqTree.prerequisites.length > 0 && (
							<section className="catalog-sheet-section">
								<p className="eyebrow">Prerequisites</p>
								<PrerequisiteTree
									nodes={prereqTree.prerequisites}
									metIds={metIds}
									unmetIds={unmetIds}
									showBadges={authed}
								/>
							</section>
						)}

						{/*{course.studyPrograms?.length > 0 && (*/}
						{/*	<section className="catalog-sheet-section">*/}
						{/*		<p className="eyebrow">Study Programs</p>*/}
						{/*		<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>*/}
						{/*			{course.studyPrograms.map((sp) => (*/}
						{/*				<span*/}
						{/*					key={sp.id}*/}
						{/*					className="tag"*/}
						{/*					style={{*/}
						{/*						background: "var(--canvas-2)",*/}
						{/*						color: "var(--ink-soft)",*/}
						{/*					}}*/}
						{/*				>*/}
						{/*					{sp.name}*/}
						{/*				</span>*/}
						{/*			))}*/}
						{/*		</div>*/}
						{/*	</section>*/}
						{/*)}*/}

						{/*{course.sourceUrl && (*/}
						{/*	<section className="catalog-sheet-section">*/}
						{/*		<a*/}
						{/*			href={course.sourceUrl}*/}
						{/*			target="_blank"*/}
						{/*			rel="noreferrer"*/}
						{/*			className="btn btn-ghost"*/}
						{/*			style={{ fontSize: 12 }}*/}
						{/*		>*/}
						{/*			<ExternalLink size={13} strokeWidth={1.75} />*/}
						{/*			View official page*/}
						{/*		</a>*/}
						{/*	</section>*/}
						{/*)}*/}
					</div>
				)}
			</div>
		</>
	);
}
