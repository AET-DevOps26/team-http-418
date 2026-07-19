import { apiFetch } from "#/api/client";
import type { Roadmap } from "#/api/types";

export function getRoadmap(): Promise<Roadmap> {
	return apiFetch<Roadmap>("/me/roadmap");
}

export function generateRoadmap(): Promise<Roadmap> {
	return apiFetch<Roadmap>("/me/roadmap/generate", {
		method: "POST",
	});
}
