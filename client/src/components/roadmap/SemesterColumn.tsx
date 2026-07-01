import { Plus } from "lucide-react";
import { useState } from "react";
import type { PlannedCourse } from "#/api/types";
import { CoursePill } from "./CoursePill";

type Props = {
	label: string;
	totalCredits: number;
	courses: PlannedCourse[];
	isCurrent: boolean;
	onAddCourse?: (courseId: string) => void;
	onRemoveCourse?: (courseId: string) => void;
};

export function SemesterColumn({
	label,
	totalCredits,
	courses,
	isCurrent,
	onAddCourse,
	onRemoveCourse,
}: Props) {
	const [courseId, setCourseId] = useState("");

	function handleAddCourse(e: React.FormEvent) {
		e.preventDefault();
		const trimmedCourseId = courseId.trim();
		if (!trimmedCourseId || !onAddCourse) return;
		onAddCourse(trimmedCourseId);
		setCourseId("");
	}

	return (
		<div
			className={`card semester-col${isCurrent ? " semester-col--current" : ""}`}
		>
			<div style={{ marginBottom: 4 }}>
				<p className="eyebrow" style={{ marginBottom: 2 }}>
					{label}
				</p>
				<span
					style={{
						fontSize: 12,
						color: "var(--muted)",
						fontFamily: "var(--font-mono)",
					}}
				>
					{totalCredits} credits
				</span>
			</div>
			{courses.length === 0 ? (
				<div
					style={{
						border: "2px dashed var(--line)",
						borderRadius: "var(--r-md)",
						padding: 16,
						textAlign: "center",
						color: "var(--muted)",
						fontSize: 12,
					}}
				>
					No courses
				</div>
			) : (
				courses.map((c) => (
					<CoursePill
						key={c.courseId}
						courseCode={c?.courseCode ?? "N/A"}
						credits={c.credits}
						status={c.status}
						onRemove={
							onRemoveCourse ? () => onRemoveCourse(c.courseId) : undefined
						}
					/>
				))
			)}
			{onAddCourse && (
				<form className="semester-add-course" onSubmit={handleAddCourse}>
					<input
						value={courseId}
						onChange={(e) => setCourseId(e.target.value)}
						placeholder="Course ID"
						aria-label={`Course ID to add to ${label}`}
					/>
					<button
						type="submit"
						aria-label={`Add course to ${label}`}
						disabled={courseId.trim().length === 0}
					>
						<Plus size={14} strokeWidth={2} />
					</button>
				</form>
			)}
		</div>
	);
}
