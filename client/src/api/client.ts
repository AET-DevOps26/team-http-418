import {
	API_VERSION,
	clearAccessToken,
	getAccessToken,
	refreshAccessToken,
	setAccessToken,
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

export type ApiFetchOptions = RequestInit & {
	responseType?: "json" | "text";
	root?: boolean;
};

async function doFetch<T>(
	path: string,
	options?: ApiFetchOptions,
	isRetry = false,
): Promise<T> {
	const token = getAccessToken();
	const hasBody = options?.body != null;

	const headers = new Headers(options?.headers);
	headers.set(
		"Accept",
		options?.responseType === "text" ? "text/plain" : "application/json",
	);
	if (hasBody && !(options?.body instanceof FormData))
		headers.set("Content-Type", "application/json");
	if (token != null) headers.set("Authorization", `Bearer ${token}`);
	const domain = window.location.origin.replace(":" + window.location.port, "");
	const port = 8080;
	let baseurl = `${domain}:${port}`;
	if (!options?.root) baseurl = `${baseurl}/api/${API_VERSION}`;
	const res = await fetch(`${baseurl}${path}`, {
		...options,
		headers,
	});

	if (res.ok) {
		if (res.status === 204) return undefined as T;
		if (options?.responseType === "text") return res.text() as Promise<T>;
		return res.json() as Promise<T>;
	}

	if (res.status === 401 && !isRetry) {
		const newToken = await refreshAccessToken();
		if (newToken != null) {
			setAccessToken(newToken);
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

export function apiFetch<T>(
	path: string,
	options?: ApiFetchOptions,
): Promise<T> {
	return doFetch<T>(path, options);
}
