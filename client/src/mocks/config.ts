export const mockConfig: Record<string, boolean> = {
  "GET /hello": true,
  // "GET /courses": true,
  // "POST /auth/login": true,
  // Add endpoints here — set false to "unlock" (use real backend)
};

export function isMocked(method: string, path: string): boolean {
  return mockConfig[`${method} ${path}`] ?? false;
}
