export {
	createConversation,
	getConversation,
	getConversations,
	getSuggestions,
	sendMessage,
} from "#/api/advisor";
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
export type {
	AdvisorSSEEvent,
	AlertSeverity,
	AlertType,
	AuthResponse,
	Conversation,
	ConversationMessage,
	ConversationSummary,
	CourseSession,
	Dashboard,
	DashboardAlert,
	DashboardProgress,
	DashboardRecommendation,
	DashboardRequirement,
	IsoDateString,
	LoginRequest,
	MessageRole,
	Page,
	ProblemDetail,
	ReferencedCourse,
	SemesterKey,
	SuggestedPrompt,
	UpcomingCourse,
} from "#/api/types";
