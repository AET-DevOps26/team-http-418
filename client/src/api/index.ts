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
export { getSchedule } from "#/api/schedule";
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
	IsoDateString,
	LoginRequest,
	Page,
	ProblemDetail,
	ScheduleConflict,
	ScheduleEvent,
	ScheduleEventType,
	SemesterKey,
	UpcomingCourse,
	WeeklySchedule,
} from "#/api/types";
