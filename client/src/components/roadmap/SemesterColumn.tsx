import type { PlannedCourse } from "#/api/types";
import { CoursePill } from "./CoursePill";

type Props = {
	label: string;
	totalCredits: number;
	courses: PlannedCourse[];
	isCurrent: boolean;
	onRemoveCourse?: (courseId: string) => void;
};

export function SemesterColumn({
	label,
	totalCredits,
	courses,
	isCurrent,
	onRemoveCourse,
}: Props) {
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
						courseCode={c.courseCode}
						credits={c.credits}
						status={c.status}
						onRemove={
							onRemoveCourse ? () => onRemoveCourse(c.courseId) : undefined
						}
					/>
				))
			)}
		</div>
	);
}
