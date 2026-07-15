import {
	BaseEdge,
	getBezierPath,
	type Edge,
	type EdgeProps,
} from "@xyflow/react";

type PrereqEdgeData = {
	type: string;
};

export type PrereqEdgeType = Edge<PrereqEdgeData, "prereqEdge">;

export function PrereqEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
}: EdgeProps<PrereqEdgeType>) {
	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const isRequired = data?.type === "REQUIRED";

	return (
		<BaseEdge
			id={id}
			path={edgePath}
			style={{
				stroke: isRequired ? "var(--danger)" : "var(--accent)",
				strokeWidth: isRequired ? 2 : 1.5,
				strokeDasharray: isRequired ? undefined : "5 4",
			}}
		/>
	);
}
