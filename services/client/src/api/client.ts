import {
	API_VERSION,
	clearAccessToken,
	getAccessToken,
	refreshAccessToken,
	setAccessToken,
} from "#/api/auth";
import type { ProblemDetail } from "#/api/types";

const UNAUTHORIZED = 401;
const NO_CONTENT = 204;

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
): Promise<T> {
	const token = getAccessToken();
	const hasBody = options?.body != null;

	const headers = new Headers(options?.headers);
	if (!headers.has("Accept")) {
		headers.set(
			"Accept",
			options?.responseType === "text" ? "text/plain" : "application/json",
		);
	}
	if (hasBody && !(options?.body instanceof FormData))
		headers.set("Content-Type", "application/json");
	if (token != null) headers.set("Authorization", `Bearer ${token}`);
	let baseurl = "";
	if (!options?.root) baseurl = `/api/${API_VERSION}`;
	const res = await fetch(`${baseurl}${path}`, {
		...options,
		headers,
	});

	if (res.ok) {
		if (res.status === NO_CONTENT) return undefined as T;
		if (options?.responseType === "text") return res.text() as Promise<T>;
		return res.json() as Promise<T>;
	}
	if (res.status === UNAUTHORIZED) {
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
