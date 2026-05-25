import {
	clearAccessToken,
	getAccessToken,
	refreshAccessToken,
} from "#/api/auth";
import type { ProblemDetail } from "#/api/types";

export class ApiError extends Error {
	status: number;
	problem: ProblemDetail;

	constructor(status: number, problem: ProblemDetail) {
		super(problem.detail ?? problem.title);
		this.name = "ApiError";
		this.status = status;
		this.problem = problem;
	}
}

async function doFetch<T>(
	path: string,
	options?: RequestInit,
	isRetry = false,
): Promise<T> {
	const token = getAccessToken();
	const hasBody = options?.body != null;

	const headers = new Headers(options?.headers);
	headers.set("Accept", "application/json");
	if (hasBody) headers.set("Content-Type", "application/json");
	if (token != null) headers.set("Authorization", `Bearer ${token}`);

	const res = await fetch(`/api${path}`, { ...options, headers });

	if (res.ok) {
		return res.json() as Promise<T>;
	}

	if (res.status === 401 && !isRetry) {
		const newToken = await refreshAccessToken();
		if (newToken != null) {
			return doFetch<T>(path, options, true);
		}
		clearAccessToken();
	}

	let problem: ProblemDetail;
	try {
		problem = (await res.json()) as ProblemDetail;
	} catch {
		problem = {
			type: "about:blank",
			title: res.statusText || "Unknown Error",
			status: res.status,
		};
	}

	throw new ApiError(res.status, problem);
}

export function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	return doFetch<T>(path, options);
}
