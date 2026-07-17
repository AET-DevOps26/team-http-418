import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
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
	const { data: course, isLoading, isError } = useCourse(courseId);
	const { data: prereqTree } = usePrerequisiteTree(courseId);
	const { data: prereqCheck } = usePrerequisiteCheck(courseId);
	const authed = isAuthenticated();
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", onKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);
	const hasCourseData = Boolean(course);

	if (isError && !hasCourseData) {
		return null;
	}

	const metIds = prereqCheck
		? new Set(prereqCheck.metPrerequisites.map((r) => r.courseId))
		: undefined;
	const unmetIds = prereqCheck
		? new Set(prereqCheck.unmetPrerequisites.map((r) => r.courseId))
		: undefined;

	const safeCourse: CourseDetail = course ?? {
		id: Number(courseId),
		title_en: "",
		title_ger: "",
		sws: 0,
		description_ger: "",
		description_en: "",
		course_objective_en: "",
		course_objective_ger: "",
		teaching_method_en: "",
		teaching_method_ger: "",
		registration_info: "",
		course_type: "",
		semester_key: "",
		org_name_ger: "",
		org_name_en: "",
		org_url: "",
		people: [],
		appointments: [],
		curriculumConnections: [],
		previous_knowledge_ger: "",
		previous_knowledge_en: "",
	};

	if (typeof document === "undefined") return null;

	return createPortal(
		<div className="catalog-sheet-root">
			<button
				type="button"
				className="catalog-sheet-overlay"
				onClick={onClose}
				aria-label="Close course detail"
			/>
			<div
				className="catalog-sheet-panel"
				role="dialog"
				aria-modal="true"
				aria-label="Course details"
			>
				<button
					type="button"
					className="catalog-sheet-close"
					onClick={onClose}
					aria-label="Close"
				>
					<X size={16} strokeWidth={1.75} />
				</button>

				{isLoading && !course && (
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

				{(course || isLoading) && (
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
									{safeCourse.title_en ?? safeCourse.title_ger ?? "N/A"}
								</span>
								<span
									className="tag"
									style={{
										background: "var(--blue-50)",
										color: "var(--blue-700)",
									}}
								>
									{safeCourse.course_type}
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
									{safeCourse.sws ?? "?"} SWS
								</span>
							</div>
							<h2 className="catalog-sheet-title">
								{safeCourse.title_en ?? safeCourse.title_ger ?? "N/A"}
							</h2>
							<p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
								{safeCourse.org_name_en}
								<br />
								{safeCourse.org_url && (
									<a
										style={{ color: "blue", textDecoration: "underline" }}
										href={safeCourse.org_url}
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
								{safeCourse.description_en ??
									safeCourse.description_ger ??
									"N/A"}
							</p>
						</section>

						{(safeCourse.previous_knowledge_en ??
							safeCourse.previous_knowledge_ger) && (
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
									{safeCourse.previous_knowledge_en ??
										safeCourse.previous_knowledge_ger}
								</p>
							</section>
						)}

						{safeCourse.people?.length > 0 && (
							<section className="catalog-sheet-section">
								<p className="eyebrow">Instructors</p>
								<div
									style={{ display: "flex", flexDirection: "column", gap: 6 }}
								>
									{safeCourse.people.map((inst) => (
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
							<ScheduleTable slots={safeCourse.appointments} />
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
		</div>,
		document.body,
	);
}
