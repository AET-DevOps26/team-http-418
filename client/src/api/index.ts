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
	addCourseToSemester,
	generateRoadmap,
	getRoadmap,
	getSemester,
	getSemesters,
	removeCourseFromSemester,
	updateRoadmap,
	updateSemester,
} from "#/api/roadmap";
export type {
	AddCourseRequest,
	AlertSeverity,
	AlertType,
	AuthResponse,
	CourseSession,
	CourseStatus,
	Dashboard,
	DashboardAlert,
	DashboardProgress,
	DashboardRecommendation,
	DashboardRequirement,
	GenerateRoadmapRequest,
	IsoDateString,
	LoginRequest,
	Page,
	PlannedCourse,
	ProblemDetail,
	Roadmap,
	RoadmapStatus,
	SemesterKey,
	SemesterPlanDetail,
	UpcomingCourse,
} from "#/api/types";
