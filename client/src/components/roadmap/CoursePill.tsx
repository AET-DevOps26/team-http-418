import { X } from "lucide-react";
import type { CourseStatus } from "#/api/types";

type Props = {
	courseCode: string;
	credits: number;
	status: CourseStatus;
	onRemove?: () => void;
};

const statusClass: Record<CourseStatus, string> = {
	COMPLETED: "course-pill--completed",
	ENROLLED: "course-pill--enrolled",
	PLANNED: "course-pill--planned",
};

export function CoursePill({ courseCode, credits, status, onRemove }: Props) {
	return (
		<div className={`course-pill ${statusClass[status]}`}>
			<span>{courseCode}</span>
			<span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
				{credits}cp
			</span>
			{status === "PLANNED" && onRemove && (
				<button
					type="button"
					className="course-pill-remove"
					onClick={onRemove}
					aria-label={`Remove ${courseCode}`}
				>
					<X size={13} strokeWidth={2} />
				</button>
			)}
		</div>
	);
}
