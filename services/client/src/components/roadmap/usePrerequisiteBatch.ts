import { useQuery } from "@tanstack/react-query";
import { getCoursePrerequisitesBatch } from "#/api/courses";

export function usePrerequisiteBatch(courseIds: string[]) {
	const uniqueCourseIds = [...new Set(courseIds.map(String))];
	const query = useQuery({
		queryKey: ["prerequisites", "batch", uniqueCourseIds],
		queryFn: () => getCoursePrerequisitesBatch(uniqueCourseIds),
		staleTime: 300_000,
		enabled: uniqueCourseIds.length > 0,
	});
	const total = uniqueCourseIds.length;
	const missing = query.data?.missingCourseIds.length ?? 0;
	const errored = query.isError ? total : missing;
	const loaded = query.data?.trees.length ?? 0;

	return {
		trees: query.data?.trees ?? [],
		loaded,
		total,
		errored,
		isLoading: query.isLoading,
	};
}
