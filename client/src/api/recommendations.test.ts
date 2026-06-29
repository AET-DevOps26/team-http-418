import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	generateRecommendations,
	getRecommendations,
} from "#/api/recommendations";

vi.mock("#/api/client", () => ({
	apiFetch: vi.fn(),
}));

describe("recommendations API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("requests recommendations without a query string when no params are set", async () => {
		const { apiFetch } = await import("#/api/client");
		vi.mocked(apiFetch).mockResolvedValue({
			generatedAt: "2026-06-28T10:00:00Z",
			recommendations: [],
		});

		await getRecommendations();

		expect(apiFetch).toHaveBeenCalledWith("/me/recommendations");
	});

	it("serializes recommendation filter params", async () => {
		const { apiFetch } = await import("#/api/client");
		vi.mocked(apiFetch).mockResolvedValue({
			generatedAt: "2026-06-28T10:00:00Z",
			recommendations: [],
		});

		await getRecommendations({
			limit: 3,
			category: "electives",
			semester: "WS2025",
		});

		expect(apiFetch).toHaveBeenCalledWith(
			"/me/recommendations?limit=3&category=electives&semester=WS2025",
		);
	});

	it("posts recommendation generation context", async () => {
		const { apiFetch } = await import("#/api/client");
		vi.mocked(apiFetch).mockResolvedValue({
			generatedAt: "2026-06-28T10:05:00Z",
			recommendations: [],
		});

		await generateRecommendations({
			goals: "machine learning",
			interests: "distributed systems",
		});

		expect(apiFetch).toHaveBeenCalledWith("/me/recommendations", {
			method: "POST",
			body: JSON.stringify({
				goals: "machine learning",
				interests: "distributed systems",
			}),
		});
	});
});
