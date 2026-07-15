import type { Edge, Node } from "@xyflow/react";
import { useMemo } from "react";
import type {
	PrerequisiteNode,
	PrerequisiteTree,
	SemesterPlanDetail,
} from "#/api/types";
import { buildLayout } from "./roadmap-layout";

function collectEdges(
	node: PrerequisiteNode,
	targetId: string,
	courseIdSet: Set<string>,
	seen: Set<string>,
	result: Edge[],
) {
	for (const prereq of node.prerequisites) {
		if (courseIdSet.has(prereq.courseId)) {
			const edgeId = `edge-${prereq.courseId}-${targetId}`;
			if (!seen.has(edgeId)) {
				seen.add(edgeId);
				result.push({
					id: edgeId,
					source: `course-${prereq.courseId}`,
					target: `course-${targetId}`,
					type: "prereqEdge",
					data: { type: prereq.type },
				});
			}
		}
		collectEdges(prereq, targetId, courseIdSet, seen, result);
	}
}

export function useRoadmapGraph(
	semesters: SemesterPlanDetail[],
	trees: PrerequisiteTree[],
) {
	const nodes = useMemo<Node[]>(() => buildLayout(semesters), [semesters]);

	const courseIdSet = useMemo(() => {
		const set = new Set<string>();
		for (const s of semesters) {
			for (const c of s.courses) set.add(c.courseId);
		}
		return set;
	}, [semesters]);

	const edges = useMemo<Edge[]>(() => {
		const result: Edge[] = [];
		const seen = new Set<string>();
		for (const tree of trees) {
			if (!courseIdSet.has(tree.courseId)) continue;
			collectEdges(
				{ courseId: tree.courseId, courseCode: tree.courseCode, courseName: tree.courseName, type: "REQUIRED", prerequisites: tree.prerequisites },
				tree.courseId,
				courseIdSet,
				seen,
				result,
			);
		}
		return result;
	}, [trees, courseIdSet]);

	return { nodes, edges };
}
