import { useQuery } from "@tanstack/react-query";
import { getSchedule } from "#/api/schedule";

export function useSchedule(semester?: string) {
	return useQuery({
		queryKey: ["schedule", semester],
		queryFn: () => getSchedule(semester),
		staleTime: 120_000,
	});
}
