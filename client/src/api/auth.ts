import { queryClient } from "#/api/query-client";
import type { AuthResponse } from "#/api/types";

const SESSION_ACCESS_KEY = "auth_access_token";
const SESSION_REFRESH_KEY = "auth_refresh_token";

let accessToken: string | null = null;
let storedRefreshToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
export const API_VERSION = import.meta.env.VITE_API_VERSION!;

export class AuthError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

function scheduleRefresh(expiresIn: number) {
	if (refreshTimer != null) clearTimeout(refreshTimer);
	const delay = (expiresIn - 60) * 1000;
	if (delay > 0) {
		refreshTimer = setTimeout(() => {
			refreshTokens().catch(() => clearTokens());
		}, delay);
	}
}

export function setTokens(res: AuthResponse): void {
	accessToken = res.accessToken;
	storedRefreshToken = res.refreshToken;
	try {
		sessionStorage.setItem(SESSION_ACCESS_KEY, res.accessToken);
		sessionStorage.setItem(SESSION_REFRESH_KEY, res.refreshToken);
	} catch {}
	scheduleRefresh(res.expiresIn);
}

export function clearTokens(): void {
	accessToken = null;
	storedRefreshToken = null;
	if (refreshTimer != null) {
		clearTimeout(refreshTimer);
		refreshTimer = null;
	}
	try {
		sessionStorage.removeItem(SESSION_ACCESS_KEY);
		sessionStorage.removeItem(SESSION_REFRESH_KEY);
	} catch {}
	queryClient.clear();
}

export function hydrateAuth(): void {
	try {
		const storedAccess = sessionStorage.getItem(SESSION_ACCESS_KEY);
		const storedRefresh = sessionStorage.getItem(SESSION_REFRESH_KEY);
		if (storedAccess && storedRefresh) {
			accessToken = storedAccess;
			storedRefreshToken = storedRefresh;
			refreshTokens().catch(() => clearTokens());
		}
	} catch {}
}

export function isAuthenticated(): boolean {
	return accessToken != null;
}

export async function login(tumId: string, password: string): Promise<void> {
	const res = await fetch(`/api/${API_VERSION}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ tumId, password }),
	});
	if (!res.ok) {
		let message = res.statusText;
		try {
			const body = (await res.json()) as { detail?: string; title?: string };
			message = body.detail ?? body.title ?? message;
		} catch {}
		throw new AuthError(res.status, message);
	}
	const data = (await res.json()) as AuthResponse;
	setTokens(data);
}

export async function refreshTokens(): Promise<string | null> {
	if (!storedRefreshToken) return null;
	const res = await fetch(`/api/${API_VERSION}/auth/refresh`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ refreshToken: storedRefreshToken }),
	});
	if (!res.ok) return null;
	const data = (await res.json()) as AuthResponse;
	setTokens(data);
	return data.accessToken;
}

export async function logout(): Promise<void> {
	try {
		await fetch(`/api/${API_VERSION}/auth/logout`, { method: "POST" });
	} catch {}
	clearTokens();
}

// Backward-compatible aliases for client.ts
export const getAccessToken = (): string | null => accessToken;
export const setAccessToken = (token: string | null): void => {
	accessToken = token;
};
export const clearAccessToken = (): void => {
	accessToken = null;
};
export const refreshAccessToken = refreshTokens;
