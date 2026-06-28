export const mockConfig: Record<string, boolean> = {
	"GET /hello": true,
	"POST /auth/login": true,
	"POST /auth/refresh": true,
	"POST /auth/logout": true,
	"GET /me/dashboard": true,
	"GET /me/roadmap": true,
	"POST /me/roadmap/generate": true,
	"PUT /me/roadmap": true,
	"GET /me/roadmap/semesters": true,
	"POST /me/roadmap/semesters/courses": true,
	"DELETE /me/roadmap/semesters/courses": true,
	// Add endpoints here — set false to "unlock" (use real backend)
};

export function isMocked(method: string, path: string): boolean {
	return mockConfig[`${method} ${path}`] ?? false;
}
