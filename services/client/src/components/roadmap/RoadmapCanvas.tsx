import {
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	ReactFlow,
	type EdgeTypes,
	type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SemesterPlanDetail } from "#/api/types";
import { CourseNode } from "./CourseNode";
import { PrereqEdge } from "./PrereqEdge";
import { SemesterGroupNode } from "./SemesterGroupNode";
import { usePrerequisiteBatch } from "./usePrerequisiteBatch";
import { useRoadmapGraph } from "./useRoadmapGraph";

const nodeTypes: NodeTypes = {
	courseNode: CourseNode,
	semesterGroup: SemesterGroupNode,
};

const edgeTypes: EdgeTypes = {
	prereqEdge: PrereqEdge,
};

type Props = {
	semesters: SemesterPlanDetail[];
};

export function RoadmapCanvas({ semesters }: Props) {
	const courseIds = semesters.flatMap((s) => s.courses.map((c) => c.courseId));
	const { trees, loaded, total, errored } = usePrerequisiteBatch(courseIds);
	const { nodes, edges } = useRoadmapGraph(semesters, trees);

	const isLoading = loaded + errored < total;

	return (
		<div className="rmc-canvas-wrap">
			{isLoading && (
				<div className="rmc-prereq-badge">
					Loading prerequisites ({loaded}/{total})
				</div>
			)}
			{!isLoading && errored > 0 && (
				<div className="rmc-prereq-badge rmc-prereq-badge--error">
					Failed to load prerequisites for {errored} course{errored > 1 ? "s" : ""}
				</div>
			)}
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				panOnScroll
				zoomOnScroll
				nodesDraggable={false}
				fitView
				fitViewOptions={{ padding: 0.15 }}
			>
				<Controls />
				<MiniMap />
				<Background
					variant={BackgroundVariant.Dots}
					gap={16}
					size={1}
					color="var(--line)"
				/>
			</ReactFlow>
		</div>
	);
}
