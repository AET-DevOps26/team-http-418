export const mockConfig: Record<string, boolean> = {
	"GET /hello": true,
	"POST /auth/login": true,
	"POST /auth/refresh": true,
	"POST /auth/logout": true,
	"GET /me/dashboard": true,
	"GET /me/advisor/conversations": true,
	"POST /me/advisor/conversations": true,
	"GET /me/advisor/conversations/:id": true,
	"POST /me/advisor/conversations/:id/messages": true,
	"GET /me/advisor/suggestions": true,
	// Add endpoints here — set false to "unlock" (use real backend)
};

export function isMocked(method: string, path: string): boolean {
	return mockConfig[`${method} ${path}`] ?? false;
}
