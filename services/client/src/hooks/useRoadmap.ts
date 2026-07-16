import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateRoadmap, getRoadmap } from "#/api/roadmap";

export function useRoadmap() {
	return useQuery({
		queryKey: ["roadmap"],
		queryFn: getRoadmap,
		refetchInterval: (query) =>
			query.state.data?.status === "GENERATING" ? 3000 : false,
	});
}

export function useGenerateRoadmap() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => generateRoadmap(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roadmap"] });
		},
	});
}
