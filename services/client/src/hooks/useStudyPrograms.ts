import { useQuery } from "@tanstack/react-query";
import { getStudyPrograms } from "#/api/catalog";

export function useStudyPrograms(departmentId?: string) {
	return useQuery({
		queryKey: ["study-programs", departmentId],
		queryFn: () => getStudyPrograms(departmentId),
		staleTime: 600_000,
	});
}
