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

export type Dashboard = {
	progress: DashboardProgress;
	alerts: DashboardAlert[];
	recommendations: DashboardRecommendation[];
	upcomingCourses: UpcomingCourse[];
	semesterCredits: number;
};
