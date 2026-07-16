import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	generateRecommendations,
	getRecommendations,
} from "#/api/recommendations";
import type { RecommendationParams } from "#/api/types";

export function useRecommendations(params?: RecommendationParams) {
	return useQuery({
		queryKey: ["recommendations", params],
		queryFn: () => getRecommendations(params),
		staleTime: 120_000,
	});
}

export function useGenerateRecommendations() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => generateRecommendations(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["recommendations"] });
		},
	});
}
