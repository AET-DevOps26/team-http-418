import type { Node } from "@xyflow/react";
import type { SemesterPlanDetail } from "#/api/types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const NODE_V_GAP = 20;
const SEMESTER_GAP = 80;
const LANE_PADDING = 20;
const HEADER_HEIGHT = 48;

export function buildLayout(semesters: SemesterPlanDetail[]): Node[] {
	const nodes: Node[] = [];
	let x = 0;

	for (const s of semesters) {
		const courseCount = Math.max(s.courses.length, 1);
		const laneHeight =
			HEADER_HEIGHT +
			LANE_PADDING +
			courseCount * NODE_HEIGHT +
			Math.max(courseCount - 1, 0) * NODE_V_GAP +
			LANE_PADDING;

		nodes.push({
			id: `sem-${s.semesterKey}`,
			type: "semesterGroup",
			position: { x, y: 0 },
			style: { width: NODE_WIDTH + LANE_PADDING * 2, height: laneHeight },
			data: {
				label: s.label,
				totalCredits: s.totalCredits,
				isCurrent: s.isCurrent,
			},
		});

		s.courses.forEach((c, i) => {
			nodes.push({
				id: `course-${c.courseId}`,
				type: "courseNode",
				parentId: `sem-${s.semesterKey}`,
				extent: "parent",
				position: {
					x: LANE_PADDING,
					y: HEADER_HEIGHT + LANE_PADDING + i * (NODE_HEIGHT + NODE_V_GAP),
				},
				style: { width: NODE_WIDTH },
				data: {
					courseId: c.courseId,
					courseCode: c.courseCode,
					courseName: c.courseName,
					credits: c.credits,
					status: c.status,
				},
			});
		});

		x += NODE_WIDTH + LANE_PADDING * 2 + SEMESTER_GAP;
	}

	return nodes;
}
