import { BookOpen } from "lucide-react";
import type { CourseSummary } from "#/api/types";

type Props = {
	course: CourseSummary;
	onClick: (courseId: string) => void;
};

export function CourseCard({ course, onClick }: Props) {
	return (
		<button
			type="button"
			className="catalog-course-card card"
			onClick={() => onClick(course.id)}
		>
			<div className="catalog-course-card-header">
				<span className="catalog-course-code">{course?.courseCode ?? "N/A"}</span>
				<div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
					<span
						className="tag"
						style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}
					>
						{course?.language ?? "N/A"}
					</span>
					<span
						className="tag"
						style={{ background: "var(--canvas-2)", color: "var(--ink-soft)" }}
					>
						{course?.level ?? "N/A"}
					</span>
				</div>
			</div>
			<p className="catalog-course-name">{course?.name ?? "N/A"}</p>
			<div className="catalog-course-meta">
				<span style={{ color: "var(--muted)", fontSize: 12 }}>
					{course?.department ?? "N/A"}
				</span>
				<span style={{ color: "var(--muted)", fontSize: 12 }}>
					{course?.credits ?? "N/A"} ECTS
				</span>
			</div>
			{course.hasPrerequisites && (
				<div
					style={{
						marginTop: 8,
						display: "flex",
						alignItems: "center",
						gap: 4,
					}}
				>
					<BookOpen size={11} strokeWidth={1.75} color="var(--muted)" />
					<span style={{ fontSize: 11, color: "var(--muted)" }}>
						Has prerequisites
					</span>
				</div>
			)}
		</button>
	);
}
