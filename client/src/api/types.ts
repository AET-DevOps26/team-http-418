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

export type Recommendation = {
	courseId: string;
	courseCode: string;
	courseName: string;
	relevanceScore: number;
	reason: string;
	tags: string[];
	prerequisitesMet: boolean;
};

export type RecommendationList = {
	recommendations: Recommendation[];
	generatedAt: IsoDateString;
};

export type GenerateRecommendationsBody = {
	goals?: string;
	interests?: string;
};

export type RecommendationParams = {
	limit?: number;
	category?: string;
	semester?: string;
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

export type MessageRole = "USER" | "ASSISTANT";

export type ReferencedCourse = {
	courseId: string;
	courseCode: string;
};

export type ConversationMessage = {
	id: string;
	role: MessageRole;
	content: string;
	referencedCourses: ReferencedCourse[];
	createdAt: IsoDateString;
};

export type ConversationSummary = {
	id: string;
	title: string;
	lastMessage: string;
	lastMessageAt: IsoDateString;
	messageCount: number;
};

export type Conversation = {
	id: string;
	title: string;
	messages: ConversationMessage[];
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
};

export type SuggestedPrompt = {
	text: string;
	category: string;
};

export type AdvisorSSEEvent =
	| { token: string }
	| { done: true; fullContent: string }
	| { error: string };

export type ImportedCourse = {
	courseId?: string;
	courseCode?: string;
	courseName?: string;
	moduleId?: string;
	titleDe?: string;
	titleEn?: string;
	grade?: string;
	credits: number;
};

export type ImportError =
	| string
	| {
			row?: number;
			message: string;
	  };

export type TranscriptImportResult = {
	importedCount: number;
	skippedCount: number;
	importedCourses: ImportedCourse[];
	errors: ImportError[];
};

export type CreditsByCategory = {
	category: string;
	earned: number;
	required: number;
};

export type AcademicProgress = {
	totalCreditsEarned: number;
	totalCreditsRequired: number;
	gpa: number;
	completedCourseCount: number;
	enrolledCourseCount: number;
	currentSemester: SemesterKey;
	progressPercentage: number;
	creditsByCategory: CreditsByCategory[];
};

export type CompletedCourse = {
	courseId: string;
	courseCode: string;
	courseName: string;
	credits: number;
	grade: number;
	semester: SemesterKey;
	category: string;
};

export type CourseScheduleEntry = {
	day: string;
	startTime: string;
	endTime: string;
	room: string;
	type: string;
};

export type EnrolledCourse = {
	courseId: string;
	courseCode: string;
	courseName: string;
	credits: number;
	semester: SemesterKey;
	schedule: CourseScheduleEntry[];
};

export type CourseStatus = "COMPLETED" | "ENROLLED" | "MISSING" | "PLANNED";

export type PlannedCourse = {
	courseId: string;
	courseCode: string;
	courseName: string;
	credits: number;
	status: CourseStatus;
};

export type RequirementCourse = {
	courseId: string;
	courseCode: string;
	courseName: string;
	credits: number;
	status: CourseStatus;
	isRequired: boolean;
};

export type RequirementCategory = {
	name: string;
	creditsRequired: number;
	creditsEarned: number;
	fulfilled: boolean;
	courses: RequirementCourse[];
};

export type RequirementAlert = {
	type: string;
	message: string;
};

export type DegreeRequirements = {
	studyProgram: { id: string; name: string };
	totalCreditsRequired: number;
	totalCreditsEarned: number;
	categories: RequirementCategory[];
	alerts: RequirementAlert[];
};

export type AddCompletedCourseRequest = {
	courseId: string;
	grade: number;
	semester: string;
};

export type EnrollCourseRequest = {
	courseId: string;
	semester: string;
};

export type SemesterPlanDetail = {
	semesterKey: SemesterKey;
	label: string;
	totalCredits: number;
	courses: PlannedCourse[];
	isCurrent: boolean;
};

export type RoadmapStatus = "READY" | "GENERATING" | "EMPTY";

export type Roadmap = {
	status: RoadmapStatus;
	semesters: SemesterPlanDetail[];
	totalPlannedCredits: number;
	estimatedGraduation: SemesterKey;
};

export type GenerateRoadmapRequest = {
	aims: string;
	maxCreditsPerSemester: number;
	interests: string[];
};

export type AddCourseRequest = {
	courseId: string;
};

// ── Course catalog types ──

export type CourseLevel = "BACHELOR" | "MASTER" | string;
export type Language = "EN" | "DE" | string;
export type PreferredSemester = "WS" | "SS" | string;
export type ScheduleType = "LECTURE" | "TUTORIAL" | "LAB" | "EXAM" | string;
export type PrerequisiteType = "REQUIRED" | "RECOMMENDED" | string;

export type CourseSummary = {
	id: string;
	courseCode: string;
	name: string;
	department: string;
	credits: number;
	language: Language;
	level: CourseLevel;
	preferredSemester: PreferredSemester;
	hasPrerequisites: boolean;
	instructors: string[];
};

export type ScheduleSlot = {
	day: string;
	startTime: string;
	endTime: string;
	room: string;
	type: ScheduleType;
};

export type Instructor = {
	name: string;
	email: string;
};

export type CoursePrerequisiteRef = {
	courseId: string;
	courseCode: string;
	name: string;
	type: PrerequisiteType;
};

export type CourseStudyProgramRef = {
	id: string;
	name: string;
	category: string;
};

export type CourseDetail = {
	id: string;
	courseCode: string;
	name: string;
	department: string;
	credits: number;
	language: Language;
	level: CourseLevel;
	preferredSemester: PreferredSemester;
	hasPrerequisites: boolean;
	instructors: Instructor[];
	description: string;
	generalRequirements: string;
	schedule: ScheduleSlot[];
	prerequisites: CoursePrerequisiteRef[];
	studyPrograms: CourseStudyProgramRef[];
	sourceUrl: string;
	lastUpdated: IsoDateString;
};

export type PrerequisiteNode = {
	courseId: string;
	courseCode: string;
	courseName: string;
	type: PrerequisiteType;
	prerequisites: PrerequisiteNode[];
};

export type PrerequisiteTree = {
	courseId: string;
	courseCode: string;
	courseName: string;
	prerequisites: PrerequisiteNode[];
};

export type PrerequisiteCheckRef = {
	courseId: string;
	courseCode: string;
	courseName: string;
	type: PrerequisiteType;
};

export type PrerequisiteCheck = {
	courseId: string;
	courseCode: string;
	eligible: boolean;
	unmetPrerequisites: PrerequisiteCheckRef[];
	metPrerequisites: PrerequisiteCheckRef[];
};

export type Department = {
	id: string;
	name: string;
};

export type StudyProgram = {
	id: string;
	name: string;
	department: string;
};

export type StudyProgramRef = {
	id: string;
	name: string;
	department: string;
};

export type StudentProfile = {
	id: string;
	tumId: string;
	name: string;
	email: string;
	semester: number;
	studyPrograms: StudyProgramRef[];
	totalCredits: number;
	preferredWorkload: number;
	careerGoals: string[];
	interests: string[];
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
};

export type StudentProfileUpdate = {
	semester?: number;
	preferredWorkload?: number;
	careerGoals?: string[];
	interests?: string[];
};

export type CourseSearchParams = {
	search?: string;
	ai?: boolean;
	department?: string;
	semester?: string;
	creditsMin?: number;
	creditsMax?: number;
	language?: string;
	level?: string;
	studyProgramId?: string;
	page?: number;
	size?: number;
};
