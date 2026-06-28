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
export { getDepartments, getStudyPrograms } from "#/api/catalog";
export type { ApiFetchOptions } from "#/api/client";
export { ApiError, apiFetch } from "#/api/client";
export {
	checkPrerequisites,
	getCourse,
	getCoursePrerequisites,
	getCourses,
} from "#/api/courses";
export { getDashboard } from "#/api/dashboard";
export { queryClient } from "#/api/query-client";
export type {
	AlertSeverity,
	AlertType,
	AuthResponse,
	CourseDetail,
	CourseLevel,
	CoursePrerequisiteRef,
	CourseSearchParams,
	CourseSession,
	CourseStudyProgramRef,
	CourseSummary,
	Dashboard,
	DashboardAlert,
	DashboardProgress,
	DashboardRecommendation,
	DashboardRequirement,
	Department,
	Instructor,
	IsoDateString,
	Language,
	LoginRequest,
	Page,
	PreferredSemester,
	PrerequisiteCheck,
	PrerequisiteCheckRef,
	PrerequisiteNode,
	PrerequisiteTree,
	PrerequisiteType,
	ProblemDetail,
	ScheduleSlot,
	ScheduleType,
	SemesterKey,
	StudyProgram,
	UpcomingCourse,
} from "#/api/types";
