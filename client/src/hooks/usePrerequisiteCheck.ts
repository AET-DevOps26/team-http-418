import { useQuery } from "@tanstack/react-query";
import { isAuthenticated } from "#/api";
import { checkPrerequisites } from "#/api/courses";

export function usePrerequisiteCheck(courseId?: string) {
	return useQuery({
		queryKey: ["prerequisite-check", courseId],
		queryFn: () => checkPrerequisites(courseId as string),
		enabled: !!courseId && isAuthenticated(),
	});
}
