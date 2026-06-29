import { useInfiniteQuery } from "@tanstack/react-query";
import { getCourses } from "#/api/courses";
import type { CourseSearchParams } from "#/api/types";

export function useCourses(params: Omit<CourseSearchParams, "page" | "size">) {
	return useInfiniteQuery({
		queryKey: ["courses", params],
		queryFn: ({ pageParam }) =>
			getCourses({ ...params, page: pageParam as number, size: 20 }),
		initialPageParam: 0,
		getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
	});
}
