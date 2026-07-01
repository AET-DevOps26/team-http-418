import { apiFetch } from "#/api/client";
import type { Dashboard } from "#/api/types";

export function getDashboard(): Promise<Dashboard> {
	return apiFetch<Dashboard>("/me/dashboard");
}
