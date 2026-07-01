import { useQuery } from "@tanstack/react-query";
import { getCoursePrerequisites } from "#/api/courses";

export function usePrerequisiteTree(courseId?: string) {
	return useQuery({
		queryKey: ["prerequisites", courseId],
		queryFn: () => getCoursePrerequisites(courseId as string),
		enabled: !!courseId,
	});
}
