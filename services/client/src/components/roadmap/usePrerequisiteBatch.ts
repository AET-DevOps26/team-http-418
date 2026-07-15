import { useQueries } from "@tanstack/react-query";
import { getCoursePrerequisites } from "#/api/courses";
import type { PrerequisiteTree } from "#/api/types";

export function usePrerequisiteBatch(courseIds: string[]) {
	const results = useQueries({
		queries: courseIds.map((id) => ({
			queryKey: ["prerequisites", id],
			queryFn: () => getCoursePrerequisites(id),
			staleTime: 300_000,
		})),
	});

	const loaded = results.filter((r) => r.isSuccess).length;
	const errored = results.filter((r) => r.isError).length;
	const total = courseIds.length;
	const trees = results
		.filter(
			(r): r is typeof r & { data: PrerequisiteTree } =>
				r.isSuccess && r.data != null,
		)
		.map((r) => r.data);

	return { trees, loaded, total, errored };
}
