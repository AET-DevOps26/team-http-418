let accessToken: string | null = null;

export function getAccessToken(): string | null {
	return accessToken;
}

export function setAccessToken(token: string | null): void {
	accessToken = token;
}

export function clearAccessToken(): void {
	accessToken = null;
}

export async function refreshAccessToken(): Promise<string | null> {
	return null;
}
