export const mockConfig: Record<string, boolean> = {
	"GET /hello": true,
	"POST /auth/login": true,
	"POST /auth/refresh": true,
	"POST /auth/logout": true,
	"GET /me/dashboard": true,
	// Add endpoints here — set false to "unlock" (use real backend)
};

export function isMocked(method: string, path: string): boolean {
	return mockConfig[`${method} ${path}`] ?? false;
}
