export type ProblemDetail = {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	[key: string]: unknown;
};

export type Page<T> = {
	content: T[];
	totalElements: number;
	totalPages: number;
	number: number;
	size: number;
	first: boolean;
	last: boolean;
	empty: boolean;
};

export type IsoDateString = string & { readonly __brand: "IsoDateString" };
export type SemesterKey = string & { readonly __brand: "SemesterKey" };

export type AuthResponse = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type LoginRequest = {
	tumId: string;
	password: string;
};

export type DashboardProgress = {
	totalCreditsEarned: number;
	totalCreditsRequired: number;
	progressPercentage: number;
	gpa: number;
	currentSemester: SemesterKey;
};

export type AlertType =
	| "PREREQUISITE_WARNING"
	| "DEADLINE"
	| "WORKLOAD"
	| "CONFLICT";
export type AlertSeverity = "INFO" | "WARNING" | "ERROR";

export type DashboardAlert = {
	type: AlertType;
	severity: AlertSeverity;
	message: string;
	relatedEntityId?: string;
	relatedEntityType?: string;
};

export type DashboardRecommendation = {
	courseId: string;
	courseCode: string;
	courseName: string;
	relevanceScore: number;
	reason: string;
};

export type CourseSession = {
	day: string;
	startTime: string;
	room: string;
};

export type UpcomingCourse = {
	courseId: string;
	courseCode: string;
	courseName: string;
	nextSession: CourseSession;
};

export type DashboardRequirement = {
	name: string;
	earned: number;
	total: number;
};

export type Dashboard = {
	progress: DashboardProgress;
	alerts: DashboardAlert[];
	recommendations: DashboardRecommendation[];
	upcomingCourses: UpcomingCourse[];
	semesterCredits: number;
	requirements?: DashboardRequirement[];
};

export type ScheduleEventType = "LECTURE" | "TUTORIAL" | "LAB" | "EXAM";

export type ScheduleEvent = {
	courseId: string;
	courseCode: string;
	courseName: string;
	type: ScheduleEventType;
	day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
	startTime: string;
	endTime: string;
	room: string;
	instructor: string;
	color: string;
};

export type ScheduleConflict = {
	type: "TIME_OVERLAP" | "WORKLOAD_EXCEEDED" | "PREREQUISITE_UNMET";
	severity: "ERROR" | "WARNING";
	message: string;
	involvedCourses: string[];
};

export type WeeklySchedule = {
	semester: SemesterKey;
	events: ScheduleEvent[];
	totalCredits: number;
	conflicts: ScheduleConflict[];
};
