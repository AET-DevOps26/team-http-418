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
export { queryClient } from "#/api/query-client";
export {
	generateRecommendations,
	getRecommendations,
} from "#/api/recommendations";
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
	GenerateRecommendationsBody,
	IsoDateString,
	LoginRequest,
	Page,
	ProblemDetail,
	Recommendation,
	RecommendationList,
	RecommendationParams,
	SemesterKey,
	UpcomingCourse,
} from "#/api/types";
