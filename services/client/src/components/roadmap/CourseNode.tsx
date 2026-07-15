import { Handle, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import type { CourseStatus } from "#/api/types";

type CourseNodeData = {
	courseId: string;
	courseCode: string;
	courseName: string;
	credits: number;
	status: CourseStatus;
};

export type CourseNodeType = Node<CourseNodeData, "courseNode">;

const statusClass: Record<CourseStatus, string> = {
	COMPLETED: "rmc-course-node--completed",
	ENROLLED: "rmc-course-node--enrolled",
	PLANNED: "rmc-course-node--planned",
	MISSING: "rmc-course-node--missing",
};

export function CourseNode({ data }: NodeProps<CourseNodeType>) {
	const [hovered, setHovered] = useState(false);
	const { courseCode, courseName, credits, status } = data;

	return (
		<div
			className={`rmc-course-node ${statusClass[status]}`}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			<Handle type="target" position={Position.Left} className="rmc-handle" />
			<Handle type="source" position={Position.Right} className="rmc-handle" />
			<NodeToolbar isVisible={hovered} position={Position.Top}>
				<div className="rmc-tooltip">
					<p className="rmc-tooltip__name">{courseName}</p>
					<p className="rmc-tooltip__meta">
						{courseCode} · {credits}cp · {status.toLowerCase()}
					</p>
				</div>
			</NodeToolbar>
			<span className="rmc-course-node__code">{courseCode}</span>
			<span className="rmc-course-node__name">{courseName}</span>
			<span className="rmc-course-node__credits">{credits}cp</span>
		</div>
	);
}
