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
	parentId: string,
	courseIdSet: Set<string>,
	seen: Set<string>,
	result: Edge[],
) {
	for (const prereq of node.prerequisites) {
		const prerequisiteId = String(prereq.courseId);
		if (courseIdSet.has(prerequisiteId) && courseIdSet.has(parentId)) {
			const edgeId = `edge-${prerequisiteId}-${parentId}`;
			if (!seen.has(edgeId)) {
				seen.add(edgeId);
				result.push({
					id: edgeId,
					source: `course-${prerequisiteId}`,
					target: `course-${parentId}`,
					type: "prereqEdge",
					data: { type: prereq.type },
				});
			}
		}
		collectEdges(prereq, prerequisiteId, courseIdSet, seen, result);
	}
}

/** Builds direct prerequisite edges only; it deliberately never bridges absent parents. */
export function buildPrerequisiteEdges(
	semesters: SemesterPlanDetail[],
	trees: PrerequisiteTree[],
): Edge[] {
	const courseIdSet = new Set(
		semesters.flatMap((semester) =>
			semester.courses.map((course) => String(course.courseId)),
		),
	);
	const result: Edge[] = [];
	const seen = new Set<string>();
	for (const tree of trees) {
		const treeCourseId = String(tree.courseId);
		if (!courseIdSet.has(treeCourseId)) continue;
		collectEdges(
			{
				courseId: treeCourseId,
				courseCode: tree.courseCode,
				courseName: tree.courseName,
				type: "REQUIRED",
				prerequisites: tree.prerequisites,
			},
			treeCourseId,
			courseIdSet,
			seen,
			result,
		);
	}
	return result;
}

export function useRoadmapGraph(
	semesters: SemesterPlanDetail[],
	trees: PrerequisiteTree[],
) {
	const nodes = useMemo<Node[]>(() => buildLayout(semesters), [semesters]);

	const edges = useMemo<Edge[]>(
		() => buildPrerequisiteEdges(semesters, trees),
		[semesters, trees],
	);

	return { nodes, edges };
}
