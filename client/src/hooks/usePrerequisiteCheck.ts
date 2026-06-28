import { useQuery } from "@tanstack/react-query";
import { checkPrerequisites } from "#/api/courses";
import { isAuthenticated } from "#/api";

export function usePrerequisiteCheck(courseId?: string) {
	return useQuery({
		queryKey: ["prerequisite-check", courseId],
		queryFn: () => checkPrerequisites(courseId as string),
		enabled: !!courseId && isAuthenticated(),
	});
}
