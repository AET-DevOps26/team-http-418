import { apiFetch } from "#/api/client";
import type {
	GenerateRecommendationsBody,
	RecommendationList,
	RecommendationParams,
} from "#/api/types";

export function getRecommendations(
	params?: RecommendationParams,
): Promise<RecommendationList> {
	const query = new URLSearchParams();
	if (params?.limit != null) query.set("limit", String(params.limit));
	if (params?.category) query.set("category", params.category);
	if (params?.semester) query.set("semester", params.semester);
	const qs = query.toString();
	return apiFetch<RecommendationList>(
		`/me/recommendations${qs ? `?${qs}` : ""}`,
	);
}

export function generateRecommendations(
	body: GenerateRecommendationsBody,
): Promise<RecommendationList> {
	return apiFetch<RecommendationList>("/me/recommendations", {
		method: "POST",
		body: JSON.stringify(body),
	});
}
