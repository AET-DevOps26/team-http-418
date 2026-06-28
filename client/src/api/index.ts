export {
	AuthError,
	clearAccessToken,
	clearTokens,
	getAccessToken,
	hydrateAuth,
	isAuthenticated,
	login,
	logout,
	refreshAccessToken,
	setAccessToken,
	setTokens,
} from "#/api/auth";
export type { ApiFetchOptions } from "#/api/client";
export { ApiError, apiFetch } from "#/api/client";
export { getDashboard } from "#/api/dashboard";
export { uploadTranscript } from "#/api/progress";
export { queryClient } from "#/api/query-client";
export type {
	AlertSeverity,
	AlertType,
	AuthResponse,
	CourseSession,
	Dashboard,
	DashboardAlert,
	DashboardProgress,
	DashboardRecommendation,
	DashboardRequirement,
	ImportError,
	ImportedCourse,
	IsoDateString,
	LoginRequest,
	Page,
	ProblemDetail,
	SemesterKey,
	TranscriptImportResult,
	UpcomingCourse,
} from "#/api/types";
