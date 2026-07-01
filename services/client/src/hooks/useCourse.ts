import { useQuery } from "@tanstack/react-query";
import { getCourse } from "#/api/courses";

export function useCourse(courseId?: string) {
	return useQuery({
		queryKey: ["course", courseId],
		queryFn: () => getCourse(courseId as string),
		enabled: !!courseId,
	});
}
