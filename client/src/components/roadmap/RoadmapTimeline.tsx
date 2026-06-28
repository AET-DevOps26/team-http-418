import { useEffect, useRef } from "react";
import type { SemesterPlanDetail } from "#/api/types";
import { SemesterColumn } from "./SemesterColumn";

type Props = {
	semesters: SemesterPlanDetail[];
	onRemoveCourse: (semesterKey: string, courseId: string) => void;
};

export function RoadmapTimeline({ semesters, onRemoveCourse }: Props) {
	const currentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		currentRef.current?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
		});
	}, []);

	return (
		<div className="planner-timeline">
			{semesters.map((s) => (
				<div key={s.semesterKey} ref={s.isCurrent ? currentRef : undefined}>
					<SemesterColumn
						label={s.label}
						totalCredits={s.totalCredits}
						courses={s.courses}
						isCurrent={s.isCurrent}
						onRemoveCourse={(courseId) =>
							onRemoveCourse(s.semesterKey, courseId)
						}
					/>
				</div>
			))}
		</div>
	);
}
