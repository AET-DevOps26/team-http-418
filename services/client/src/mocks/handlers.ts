import { delay, HttpResponse, http, passthrough } from "msw";
import { API_VERSION } from "#/api/auth.ts";
import type {
	Conversation,
	ConversationMessage,
	ConversationSummary,
	IsoDateString,
	Recommendation,
	RecommendationList,
} from "#/api/types";
import { isMocked } from "./config";

const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_REFRESH_TOKEN = "mock-refresh-token";
const INITIAL_RECOMMENDATIONS_GENERATED_AT = "2026-06-28T10:00:00Z";
const PERSONALIZED_RECOMMENDATIONS_GENERATED_AT = "2026-06-28T10:05:00Z";

type MockRecommendation = Recommendation & {
	semesters: string[];
};

const initialRecommendations: MockRecommendation[] = [
	{
		courseId: "in0001",
		courseCode: "IN0001",
		courseName: "Fundamentals of Programming",
		relevanceScore: 0.97,
		reason:
			"Core requirement for your Computer Science degree, not yet completed.",
		tags: ["core", "programming"],
		prerequisitesMet: true,
		semesters: ["WS2025", "SS2026"],
	},
	{
		courseId: "in2322",
		courseCode: "IN2322",
		courseName: "Advanced Algorithms",
		relevanceScore: 0.88,
		reason:
			"Highly rated by students with your profile. Builds on Algorithms & Data Structures.",
		tags: ["core", "algorithms"],
		prerequisitesMet: false,
		semesters: ["WS2025"],
	},
	{
		courseId: "in0012",
		courseCode: "IN0012",
		courseName: "Database Systems",
		relevanceScore: 0.82,
		reason: "Prerequisite for several courses in your remaining curriculum.",
		tags: ["core", "databases"],
		prerequisitesMet: true,
		semesters: ["SS2026"],
	},
	{
		courseId: "in2346",
		courseCode: "IN2346",
		courseName: "Machine Learning",
		relevanceScore: 0.79,
		reason:
			"High demand elective aligned with your interests in AI and data science.",
		tags: ["electives", "machine-learning"],
		prerequisitesMet: true,
		semesters: ["WS2025"],
	},
	{
		courseId: "in0020",
		courseCode: "IN0020",
		courseName: "Computer Networks",
		relevanceScore: 0.74,
		reason: "Essential for distributed systems specialisation.",
		tags: ["core", "networks"],
		prerequisitesMet: true,
		semesters: ["SS2026"],
	},
	{
		courseId: "ma0001",
		courseCode: "MA0001",
		courseName: "Analysis 1",
		relevanceScore: 0.7,
		reason:
			"Mathematics requirement — foundational for theoretical CS courses.",
		tags: ["mathematics"],
		prerequisitesMet: true,
		semesters: ["WS2025"],
	},
	{
		courseId: "in2305",
		courseCode: "IN2305",
		courseName: "Operating Systems",
		relevanceScore: 0.68,
		reason: "Core systems course. Students who took this rated it highly.",
		tags: ["core", "systems"],
		prerequisitesMet: false,
		semesters: ["SS2026"],
	},
	{
		courseId: "in2219",
		courseCode: "IN2219",
		courseName: "Practical Course: Database Engineering",
		relevanceScore: 0.62,
		reason: "Applied elective that complements Database Systems theory.",
		tags: ["electives", "databases"],
		prerequisitesMet: false,
		semesters: ["WS2025", "SS2026"],
	},
];

const personalizedRecommendations: MockRecommendation[] = [
	{
		courseId: "in2346",
		courseCode: "IN2346",
		courseName: "Machine Learning",
		relevanceScore: 0.95,
		reason: "Directly aligned with your stated goals. High career value.",
		tags: ["electives", "machine-learning"],
		prerequisitesMet: true,
		semesters: ["WS2025"],
	},
	{
		courseId: "in2157",
		courseCode: "IN2157",
		courseName: "Deep Learning",
		relevanceScore: 0.91,
		reason: "Top elective for your specified interests in AI.",
		tags: ["electives", "machine-learning"],
		prerequisitesMet: false,
		semesters: ["SS2026"],
	},
	{
		courseId: "in0012",
		courseCode: "IN0012",
		courseName: "Database Systems",
		relevanceScore: 0.85,
		reason: "Prerequisite for several courses in your remaining curriculum.",
		tags: ["core", "databases"],
		prerequisitesMet: true,
		semesters: ["SS2026"],
	},
	{
		courseId: "in0001",
		courseCode: "IN0001",
		courseName: "Fundamentals of Programming",
		relevanceScore: 0.8,
		reason: "Core requirement for your Computer Science degree.",
		tags: ["core", "programming"],
		prerequisitesMet: true,
		semesters: ["WS2025", "SS2026"],
	},
	{
		courseId: "in2362",
		courseCode: "IN2362",
		courseName: "Distributed Systems",
		relevanceScore: 0.76,
		reason: "Strong alignment with your distributed systems interest.",
		tags: ["electives", "systems"],
		prerequisitesMet: true,
		semesters: ["WS2025"],
	},
	{
		courseId: "in2219",
		courseCode: "IN2219",
		courseName: "Practical Course: Database Engineering",
		relevanceScore: 0.71,
		reason: "Hands-on experience complements your academic interests.",
		tags: ["electives", "databases"],
		prerequisitesMet: false,
		semesters: ["WS2025", "SS2026"],
	},
];

let currentRecommendations = initialRecommendations;
let recommendationsGeneratedAt = INITIAL_RECOMMENDATIONS_GENERATED_AT;

function toRecommendationList(
	recommendations: MockRecommendation[],
): RecommendationList {
	return {
		generatedAt:
			recommendationsGeneratedAt as RecommendationList["generatedAt"],
		recommendations: recommendations.map(({ semesters, ...recommendation }) => {
			void semesters;
			return recommendation;
		}),
	};
}

function filterRecommendations(
	recommendations: MockRecommendation[],
	searchParams: URLSearchParams,
) {
	const category = searchParams.get("category");
	const semester = searchParams.get("semester");
	const limit = Number(searchParams.get("limit"));

	const filtered = recommendations.filter((recommendation) => {
		const matchesCategory =
			category == null || recommendation.tags.includes(category);
		const matchesSemester =
			semester == null || recommendation.semesters.includes(semester);
		return matchesCategory && matchesSemester;
	});

	if (Number.isInteger(limit) && limit > 0) return filtered.slice(0, limit);
	return filtered;
}

let mockProfile = {
	id: "stu-001",
	tumId: "ga12abc",
	name: "Max Mustermann",
	email: "max.mustermann@tum.de",
	semester: 5,
	studyPrograms: [
		{
			id: "sp-cs-bsc",
			name: "Computer Science B.Sc.",
			department: "Department of Informatics",
		},
		{
			id: "sp-math-minor",
			name: "Mathematics (Minor)",
			department: "Department of Mathematics",
		},
	],
	totalCredits: 84,
	preferredWorkload: 30,
	careerGoals: [
		"Software Engineering",
		"Machine Learning",
		"Distributed Systems",
	],
	interests: ["Algorithms", "Cloud Computing", "Open Source"],
	createdAt: "2024-04-01T08:00:00Z",
	updatedAt: "2026-06-15T14:30:00Z",
};

function isoNow(): IsoDateString {
	return new Date().toISOString() as IsoDateString;
}

function iso(value: string): IsoDateString {
	return value as IsoDateString;
}

const advisorConversations = new Map<string, Conversation>([
	[
		"conv-1",
		{
			id: "conv-1",
			title: "Course recommendations for WS2025",
			messages: [
				{
					id: "msg-1",
					role: "USER",
					content: "What courses should I take next semester?",
					referencedCourses: [],
					createdAt: iso("2025-12-15T14:25:00Z"),
				},
				{
					id: "msg-2",
					role: "ASSISTANT",
					content:
						"Based on your progress (84/180 credits, GPA 2.1), I'd recommend focusing on core requirements you haven't completed yet. Here are my top suggestions:\n\n1. **IN0001 Fundamentals of Programming** — This is a core requirement you still need.\n2. **IN2322 Advanced Algorithms** — Builds on your completed Algorithms & Data Structures course.\n3. **IN0012 Database Systems** — Prerequisite for several courses in your remaining curriculum.",
					referencedCourses: [
						{ courseId: "in0001", courseCode: "IN0001" },
						{ courseId: "in2322", courseCode: "IN2322" },
						{ courseId: "in0012", courseCode: "IN0012" },
					],
					createdAt: iso("2025-12-15T14:25:30Z"),
				},
				{
					id: "msg-3",
					role: "USER",
					content: "What about the workload if I take all three?",
					referencedCourses: [],
					createdAt: iso("2025-12-15T14:28:00Z"),
				},
				{
					id: "msg-4",
					role: "ASSISTANT",
					content:
						"Taking all three would put you at roughly 24 credits, which is well within the recommended range of 28-32 credits per semester. The estimated weekly workload would be about 36 hours including lectures, tutorials, and self-study.\n\nHowever, note that Advanced Algorithms has a reputation for being demanding. If you want a lighter semester, you could swap it for a less intensive elective.",
					referencedCourses: [],
					createdAt: iso("2025-12-15T14:28:45Z"),
				},
			],
			createdAt: iso("2025-12-15T14:25:00Z"),
			updatedAt: iso("2025-12-15T14:30:00Z"),
		},
	],
	[
		"conv-2",
		{
			id: "conv-2",
			title: "Prerequisite check for Machine Learning",
			messages: [
				{
					id: "msg-5",
					role: "USER",
					content: "Can I enroll in Machine Learning next semester?",
					referencedCourses: [],
					createdAt: iso("2025-12-14T09:12:00Z"),
				},
				{
					id: "msg-6",
					role: "ASSISTANT",
					content:
						"You still need Linear Algebra (MA0902) before enrolling in Machine Learning.",
					referencedCourses: [{ courseId: "ma0902", courseCode: "MA0902" }],
					createdAt: iso("2025-12-14T09:15:00Z"),
				},
			],
			createdAt: iso("2025-12-14T09:12:00Z"),
			updatedAt: iso("2025-12-14T09:15:00Z"),
		},
	],
	[
		"conv-3",
		{
			id: "conv-3",
			title: "Semester workload planning",
			messages: [
				{
					id: "msg-7",
					role: "USER",
					content: "Is 32 credits manageable next semester?",
					referencedCourses: [],
					createdAt: iso("2025-12-12T16:40:00Z"),
				},
				{
					id: "msg-8",
					role: "ASSISTANT",
					content:
						"Taking 32 credits would put you above the recommended workload.",
					referencedCourses: [],
					createdAt: iso("2025-12-12T16:45:00Z"),
				},
			],
			createdAt: iso("2025-12-12T16:40:00Z"),
			updatedAt: iso("2025-12-12T16:45:00Z"),
		},
	],
]);

function toConversationSummary(
	conversation: Conversation,
): ConversationSummary {
	const lastMessage = conversation.messages.at(-1);

	return {
		id: conversation.id,
		title: conversation.title,
		lastMessage: lastMessage?.content ?? "No messages yet",
		lastMessageAt: lastMessage?.createdAt ?? conversation.updatedAt,
		messageCount: conversation.messages.length,
	};
}

function addAdvisorMessage(
	conversationId: string,
	message: ConversationMessage,
): Conversation | undefined {
	const conversation = advisorConversations.get(conversationId);
	if (!conversation) return undefined;

	const updatedConversation = {
		...conversation,
		messages: [...conversation.messages, message],
		updatedAt: message.createdAt,
	};
	advisorConversations.set(conversationId, updatedConversation);

	return updatedConversation;
}

let mockCompletedCourses = [
	{
		courseId: "c1",
		courseCode: "IN0001",
		courseName: "Introduction to Informatics 1",
		credits: 8,
		grade: 1.3,
		semester: "WS2023",
		category: "Core",
	},
	{
		courseId: "c2",
		courseCode: "IN0002",
		courseName: "Introduction to Informatics 2",
		credits: 8,
		grade: 1.7,
		semester: "SS2024",
		category: "Core",
	},
	{
		courseId: "c3",
		courseCode: "MA0001",
		courseName: "Linear Algebra",
		credits: 8,
		grade: 2.0,
		semester: "WS2023",
		category: "Mathematics",
	},
	{
		courseId: "c4",
		courseCode: "IN0003",
		courseName: "Algorithms and Data Structures",
		credits: 6,
		grade: 1.0,
		semester: "SS2024",
		category: "Core",
	},
	{
		courseId: "c5",
		courseCode: "IN2346",
		courseName: "Introduction to Deep Learning",
		credits: 6,
		grade: 1.7,
		semester: "WS2024",
		category: "Elective",
	},
	{
		courseId: "c6",
		courseCode: "MA0002",
		courseName: "Analysis",
		credits: 8,
		grade: 2.3,
		semester: "WS2023",
		category: "Mathematics",
	},
	{
		courseId: "c7",
		courseCode: "IN0006",
		courseName: "Introduction to Software Engineering",
		credits: 6,
		grade: 1.3,
		semester: "SS2024",
		category: "Core",
	},
	{
		courseId: "c8",
		courseCode: "IN0007",
		courseName: "Fundamentals of Programming",
		credits: 8,
		grade: 1.0,
		semester: "WS2023",
		category: "Core",
	},
	{
		courseId: "c9",
		courseCode: "IN0012",
		courseName: "Database Systems",
		credits: 6,
		grade: 2.0,
		semester: "WS2024",
		category: "Core",
	},
	{
		courseId: "c10",
		courseCode: "IN0008",
		courseName: "Computer Architecture",
		credits: 6,
		grade: 2.3,
		semester: "SS2024",
		category: "Core",
	},
	{
		courseId: "c11",
		courseCode: "IN0009",
		courseName: "Computer Networks",
		credits: 6,
		grade: 1.7,
		semester: "WS2024",
		category: "Core",
	},
	{
		courseId: "c12",
		courseCode: "IN0010",
		courseName: "Operating Systems",
		credits: 6,
		grade: 2.0,
		semester: "WS2024",
		category: "Core",
	},
];

let mockEnrolledCourses = [
	{
		courseId: "e1",
		courseCode: "IN2349",
		courseName: "Advanced Deep Learning",
		credits: 6,
		semester: "SS2025",
		schedule: [
			{
				day: "MONDAY",
				startTime: "10:00",
				endTime: "12:00",
				room: "MW 0001",
				type: "LECTURE",
			},
		],
	},
	{
		courseId: "e2",
		courseCode: "IN2390",
		courseName: "Robot Learning",
		credits: 6,
		semester: "SS2025",
		schedule: [
			{
				day: "WEDNESDAY",
				startTime: "14:00",
				endTime: "16:00",
				room: "MI 01.08.021",
				type: "LECTURE",
			},
		],
	},
	{
		courseId: "e3",
		courseCode: "IN2322",
		courseName: "Advanced Algorithms",
		credits: 8,
		semester: "SS2025",
		schedule: [
			{
				day: "TUESDAY",
				startTime: "14:00",
				endTime: "16:00",
				room: "MW 2001",
				type: "LECTURE",
			},
			{
				day: "THURSDAY",
				startTime: "10:00",
				endTime: "12:00",
				room: "MW 2001",
				type: "TUTORIAL",
			},
		],
	},
	{
		courseId: "e4",
		courseCode: "IN0015",
		courseName: "Distributed Systems",
		credits: 6,
		semester: "SS2025",
		schedule: [
			{
				day: "FRIDAY",
				startTime: "10:00",
				endTime: "12:00",
				room: "MI 00.08.038",
				type: "LECTURE",
			},
		],
	},
];

const CATEGORY_REQUIREMENTS = [
	{ category: "Core", label: "Core Modules", required: 72 },
	{ category: "Elective", label: "Electives", required: 30 },
	{ category: "Mathematics", label: "Mathematics", required: 18 },
	{ category: "Thesis", label: "Thesis", required: 30 },
	{ category: "Practical", label: "Practical", required: 30 },
];

function getTotalCompletedCredits() {
	return mockCompletedCourses.reduce((sum, course) => sum + course.credits, 0);
}

function getCompletedCreditsForCategory(category: string) {
	return mockCompletedCourses
		.filter((course) => course.category === category)
		.reduce((sum, course) => sum + course.credits, 0);
}

function getCreditsByCategory() {
	return CATEGORY_REQUIREMENTS.map(({ category, label, required }) => ({
		category: label,
		earned: getCompletedCreditsForCategory(category),
		required,
	}));
}

function getRequirementStatus(courseId: string) {
	if (mockCompletedCourses.some((course) => course.courseId === courseId)) {
		return "COMPLETED";
	}
	if (mockEnrolledCourses.some((course) => course.courseId === courseId)) {
		return "ENROLLED";
	}
	return "MISSING";
}

export const handlers = [
	http.get(`/api/${API_VERSION}/hello`, () => {
		if (!isMocked("GET", "/hello")) return passthrough();
		return new HttpResponse("hello world (mock)", {
			headers: { "Content-Type": "text/plain" },
		});
	}),

	http.post(`/api/${API_VERSION}/auth/login`, async ({ request }) => {
		if (!isMocked("POST", "/auth/login")) return passthrough();
		const body = (await request.json()) as {
			tumId?: string;
			password?: string;
		};
		if (body.tumId === "ga12abc" && body.password === "password") {
			return HttpResponse.json({
				accessToken: MOCK_ACCESS_TOKEN,
				refreshToken: MOCK_REFRESH_TOKEN,
				expiresIn: 3600,
			});
		}
		return HttpResponse.json(
			{ type: "about:blank", title: "Unauthorized", status: 401 },
			{ status: 401 },
		);
	}),

	http.post(`/api/${API_VERSION}/auth/refresh`, async () => {
		if (!isMocked("POST", "/auth/refresh")) return passthrough();
		return HttpResponse.json({
			accessToken: MOCK_ACCESS_TOKEN,
			refreshToken: MOCK_REFRESH_TOKEN,
			expiresIn: 3600,
		});
	}),

	http.post(`/api/${API_VERSION}/auth/logout`, () => {
		if (!isMocked("POST", "/auth/logout")) return passthrough();
		return new HttpResponse(null, { status: 204 });
	}),

	http.get(`/api/${API_VERSION}/me/schedule`, ({ request }) => {
		if (!isMocked("GET", "/me/schedule")) return passthrough();
		const url = new URL(request.url);
		const semester = url.searchParams.get("semester") ?? "SS2025";
		return HttpResponse.json({
			semester,
			totalCredits: 30,
			events: [
				{
					courseId: "in0001",
					courseCode: "IN0001",
					courseName: "Fundamentals of Programming",
					type: "LECTURE",
					day: "MONDAY",
					startTime: "08:00",
					endTime: "10:00",
					room: "MI 01.06.011",
					instructor: "Prof. Dr. Seidl",
					color: "#3b82f6",
				},
				{
					courseId: "in0001",
					courseCode: "IN0001",
					courseName: "Fundamentals of Programming",
					type: "TUTORIAL",
					day: "WEDNESDAY",
					startTime: "14:00",
					endTime: "16:00",
					room: "MI 01.09.014",
					instructor: "Anna Müller",
					color: "#3b82f6",
				},
				{
					courseId: "in2322",
					courseCode: "IN2322",
					courseName: "Advanced Algorithms",
					type: "LECTURE",
					day: "TUESDAY",
					startTime: "14:00",
					endTime: "16:00",
					room: "MW 2001",
					instructor: "Prof. Dr. Kretschmer",
					color: "#8b5cf6",
				},
				{
					courseId: "in2322",
					courseCode: "IN2322",
					courseName: "Advanced Algorithms",
					type: "LAB",
					day: "THURSDAY",
					startTime: "14:00",
					endTime: "16:00",
					room: "MI 00.08.038",
					instructor: "Prof. Dr. Kretschmer",
					color: "#8b5cf6",
				},
				{
					courseId: "in0012",
					courseCode: "IN0012",
					courseName: "Database Systems",
					type: "LECTURE",
					day: "THURSDAY",
					startTime: "14:00",
					endTime: "16:00",
					room: "MI 00.08.038",
					instructor: "Prof. Dr. Kemper",
					color: "#10b981",
				},
				{
					courseId: "in0012",
					courseCode: "IN0012",
					courseName: "Database Systems",
					type: "TUTORIAL",
					day: "FRIDAY",
					startTime: "10:00",
					endTime: "12:00",
					room: "MI 01.06.011",
					instructor: "Max Schmidt",
					color: "#10b981",
				},
				{
					courseId: "ma0901",
					courseCode: "MA0901",
					courseName: "Linear Algebra",
					type: "LECTURE",
					day: "TUESDAY",
					startTime: "10:00",
					endTime: "12:00",
					room: "MW 0001",
					instructor: "Prof. Dr. Brokate",
					color: "#f59e0b",
				},
			],
			conflicts: [
				{
					type: "TIME_OVERLAP",
					severity: "WARNING",
					message:
						"Advanced Algorithms lab and Database Systems lecture overlap on Thursday 14:00–16:00.",
					involvedCourses: ["IN2322", "IN0012"],
				},
			],
		});
	}),

	http.get(`/api/${API_VERSION}/me/advisor/conversations`, () => {
		if (!isMocked("GET", "/me/advisor/conversations")) return passthrough();
		const content = [...advisorConversations.values()]
			.sort(
				(a, b) =>
					new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
			)
			.map(toConversationSummary);

		return HttpResponse.json({
			content,
			totalElements: content.length,
			totalPages: 1,
			number: 0,
			size: 20,
			first: true,
			last: true,
			empty: content.length === 0,
		});
	}),

	http.post(
		`/api/${API_VERSION}/me/advisor/conversations`,
		async ({ request }) => {
			if (!isMocked("POST", "/me/advisor/conversations")) return passthrough();
			let body: { title?: string } = {};
			try {
				body = (await request.json()) as { title?: string };
			} catch {}

			const id = `conv-${crypto.randomUUID().slice(0, 8)}`;
			const now = isoNow();
			const conversation: Conversation = {
				id,
				title: body.title?.trim() || "New conversation",
				messages: [],
				createdAt: now,
				updatedAt: now,
			};
			advisorConversations.set(id, conversation);

			return HttpResponse.json(conversation);
		},
	),

	http.get(`/api/${API_VERSION}/me/advisor/conversations/:id`, ({ params }) => {
		if (!isMocked("GET", "/me/advisor/conversations/:id")) return passthrough();
		const id = params.id as string;
		const conversation = advisorConversations.get(id);

		if (!conversation) {
			return HttpResponse.json(
				{ type: "about:blank", title: "Not Found", status: 404 },
				{ status: 404 },
			);
		}

		return HttpResponse.json(conversation);
	}),

	http.post(
		`/api/${API_VERSION}/me/advisor/conversations/:id/messages`,
		async ({ params, request }) => {
			if (!isMocked("POST", "/me/advisor/conversations/:id/messages"))
				return passthrough();

			const conversationId = params.id as string;
			if (!advisorConversations.has(conversationId)) {
				return HttpResponse.json(
					{ type: "about:blank", title: "Not Found", status: 404 },
					{ status: 404 },
				);
			}

			const body = (await request.json()) as { content: string };
			const userMessage: ConversationMessage = {
				id: `msg-${crypto.randomUUID()}`,
				role: "USER",
				content: body.content,
				referencedCourses: [],
				createdAt: isoNow(),
			};
			const tokens =
				`I understand you're asking about "${body.content.slice(0, 50)}". Let me help with that.\n\nBased on your academic profile, here's what I'd recommend:\n\n1. Review your current degree requirements to ensure you're on track.\n2. Consider your workload balance across the semester.\n3. Talk to your department advisor for course-specific guidance.\n\nWould you like me to go deeper on any of these points?`.split(
					"",
				);
			const fullContent = tokens.join("");

			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					addAdvisorMessage(conversationId, userMessage);

					for (const token of tokens) {
						const event = JSON.stringify({ token });
						controller.enqueue(encoder.encode(`data: ${event}\n\n`));
						await new Promise((r) => setTimeout(r, 20));
					}
					const assistantMessage: ConversationMessage = {
						id: `msg-${crypto.randomUUID()}`,
						role: "ASSISTANT",
						content: fullContent,
						referencedCourses: [],
						createdAt: isoNow(),
					};
					addAdvisorMessage(conversationId, assistantMessage);

					const doneEvent = JSON.stringify({
						done: true,
						fullContent,
					});
					controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
					controller.close();
				},
			});

			return new HttpResponse(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
			});
		},
	),

	http.get(`/api/${API_VERSION}/me/advisor/suggestions`, () => {
		if (!isMocked("GET", "/me/advisor/suggestions")) return passthrough();
		return HttpResponse.json([
			{
				text: "What courses should I take next semester?",
				category: "Course Planning",
			},
			{
				text: "Am I on track to graduate on time?",
				category: "Course Planning",
			},
			{
				text: "Which electives fit my remaining requirements?",
				category: "Requirements",
			},
			{
				text: "What prerequisites am I missing?",
				category: "Requirements",
			},
			{
				text: "How can I improve my GPA?",
				category: "Academic Performance",
			},
			{
				text: "Is my semester workload too heavy?",
				category: "Academic Performance",
			},
		]);
	}),

	// ── Roadmap ──

	...(() => {
		let generating = false;

		const mockSemesters = [
			{
				semesterKey: "WS2023",
				label: "Winter 2023/24",
				totalCredits: 30,
				isCurrent: false,
				courses: [
					{
						courseId: "in0001",
						courseCode: "IN0001",
						courseName: "Intro to Informatics",
						credits: 8,
						status: "COMPLETED",
					},
					{
						courseId: "in0002",
						courseCode: "IN0002",
						courseName: "Fundamentals of Programming",
						credits: 10,
						status: "COMPLETED",
					},
					{
						courseId: "ma0001",
						courseCode: "MA0001",
						courseName: "Linear Algebra",
						credits: 7,
						status: "COMPLETED",
					},
					{
						courseId: "ma0002",
						courseCode: "MA0002",
						courseName: "Analysis 1",
						credits: 5,
						status: "COMPLETED",
					},
				],
			},
			{
				semesterKey: "SS2024",
				label: "Summer 2024",
				totalCredits: 28,
				isCurrent: false,
				courses: [
					{
						courseId: "in0003",
						courseCode: "IN0003",
						courseName: "Algorithms & Data Structures",
						credits: 8,
						status: "COMPLETED",
					},
					{
						courseId: "in0004",
						courseCode: "IN0004",
						courseName: "Computer Architecture",
						credits: 6,
						status: "COMPLETED",
					},
					{
						courseId: "in0006",
						courseCode: "IN0006",
						courseName: "Discrete Structures",
						credits: 8,
						status: "COMPLETED",
					},
					{
						courseId: "ma0003",
						courseCode: "MA0003",
						courseName: "Analysis 2",
						credits: 6,
						status: "COMPLETED",
					},
				],
			},
			{
				semesterKey: "WS2024",
				label: "Winter 2024/25",
				totalCredits: 26,
				isCurrent: false,
				courses: [
					{
						courseId: "in0007",
						courseCode: "IN0007",
						courseName: "Fundamentals of Databases",
						credits: 6,
						status: "COMPLETED",
					},
					{
						courseId: "in0008",
						courseCode: "IN0008",
						courseName: "Operating Systems",
						credits: 6,
						status: "COMPLETED",
					},
					{
						courseId: "in0009",
						courseCode: "IN0009",
						courseName: "Software Engineering",
						credits: 8,
						status: "COMPLETED",
					},
					{
						courseId: "in0010",
						courseCode: "IN0010",
						courseName: "Theoretical CS",
						credits: 6,
						status: "COMPLETED",
					},
				],
			},
			{
				semesterKey: "SS2025",
				label: "Summer 2025",
				totalCredits: 30,
				isCurrent: true,
				courses: [
					{
						courseId: "in2322",
						courseCode: "IN2322",
						courseName: "Advanced Algorithms",
						credits: 8,
						status: "ENROLLED",
					},
					{
						courseId: "in0012",
						courseCode: "IN0012",
						courseName: "Database Systems",
						credits: 6,
						status: "ENROLLED",
					},
					{
						courseId: "in0015",
						courseCode: "IN0015",
						courseName: "Computer Networks",
						credits: 8,
						status: "ENROLLED",
					},
					{
						courseId: "in2010",
						courseCode: "IN2010",
						courseName: "Cloud Computing",
						credits: 8,
						status: "ENROLLED",
					},
				],
			},
			{
				semesterKey: "WS2025",
				label: "Winter 2025/26",
				totalCredits: 30,
				isCurrent: false,
				courses: [
					{
						courseId: "in2106",
						courseCode: "IN2106",
						courseName: "Machine Learning",
						credits: 8,
						status: "PLANNED",
					},
					{
						courseId: "in2345",
						courseCode: "IN2345",
						courseName: "Distributed Systems",
						credits: 6,
						status: "PLANNED",
					},
					{
						courseId: "in2178",
						courseCode: "IN2178",
						courseName: "Information Security",
						credits: 8,
						status: "PLANNED",
					},
					{
						courseId: "in2349",
						courseCode: "IN2349",
						courseName: "Computer Vision",
						credits: 8,
						status: "PLANNED",
					},
				],
			},
			{
				semesterKey: "SS2026",
				label: "Summer 2026",
				totalCredits: 36,
				isCurrent: false,
				courses: [
					{
						courseId: "in2399",
						courseCode: "IN2399",
						courseName: "Bachelor's Thesis",
						credits: 12,
						status: "PLANNED",
					},
					{
						courseId: "in2400",
						courseCode: "IN2400",
						courseName: "Seminar: AI Ethics",
						credits: 6,
						status: "PLANNED",
					},
					{
						courseId: "in2401",
						courseCode: "IN2401",
						courseName: "Practical Course: DevOps",
						credits: 10,
						status: "PLANNED",
					},
					{
						courseId: "in2189",
						courseCode: "IN2189",
						courseName: "Deep Learning",
						credits: 8,
						status: "PLANNED",
					},
				],
			},
		];

		const buildRoadmap = () => ({
			status: generating ? "GENERATING" : "READY",
			semesters: mockSemesters,
			totalPlannedCredits: mockSemesters.reduce(
				(total, semester) => total + semester.totalCredits,
				0,
			),
			estimatedGraduation: "SS2026",
		});

		const notFound = () =>
			HttpResponse.json(
				{ type: "about:blank", title: "Not Found", status: 404 },
				{ status: 404 },
			);

		return [
			http.get(`/api/${API_VERSION}/me/roadmap`, () => {
				if (!isMocked("GET", "/me/roadmap")) return passthrough();
				return HttpResponse.json(buildRoadmap());
			}),

			http.post(`/api/${API_VERSION}/me/roadmap/generate`, () => {
				if (!isMocked("POST", "/me/roadmap/generate")) return passthrough();
				generating = true;
				setTimeout(() => {
					generating = false;
				}, 5000);
				return HttpResponse.json(buildRoadmap(), { status: 202 });
			}),

			http.put(`/api/${API_VERSION}/me/roadmap`, () => {
				if (!isMocked("PUT", "/me/roadmap")) return passthrough();
				return HttpResponse.json(buildRoadmap());
			}),

			http.get(`/api/${API_VERSION}/me/roadmap/semesters`, () => {
				if (!isMocked("GET", "/me/roadmap/semesters")) return passthrough();
				return HttpResponse.json(mockSemesters);
			}),

			http.get(
				`/api/${API_VERSION}/me/roadmap/semesters/:key`,
				({ params }) => {
					if (!isMocked("GET", "/me/roadmap/semesters/:key"))
						return passthrough();
					const semester = mockSemesters.find(
						(s) => s.semesterKey === params.key,
					);
					if (!semester) return notFound();
					return HttpResponse.json(semester);
				},
			),

			http.put(
				`/api/${API_VERSION}/me/roadmap/semesters/:key`,
				async ({ params, request }) => {
					if (!isMocked("PUT", "/me/roadmap/semesters/:key"))
						return passthrough();
					const body = (await request.json()) as Partial<
						(typeof mockSemesters)[number]
					>;
					const semester = mockSemesters.find(
						(s) => s.semesterKey === params.key,
					);
					if (!semester) return notFound();
					Object.assign(semester, {
						...body,
						semesterKey: semester.semesterKey,
					});
					return HttpResponse.json(semester);
				},
			),

			http.post(
				`/api/${API_VERSION}/me/roadmap/semesters/:key/courses`,
				async ({ params, request }) => {
					if (!isMocked("POST", "/me/roadmap/semesters/courses"))
						return passthrough();
					const body = (await request.json()) as { courseId: string };
					const semester = mockSemesters.find(
						(s) => s.semesterKey === params.key,
					);
					if (!semester) return notFound();
					semester.courses.push({
						courseId: body.courseId,
						courseCode: body.courseId.toUpperCase(),
						courseName: "New Course",
						credits: 5,
						status: "PLANNED",
					});
					semester.totalCredits += 5;
					return HttpResponse.json(semester, { status: 201 });
				},
			),

			http.delete(
				`/api/${API_VERSION}/me/roadmap/semesters/:key/courses/:courseId`,
				({ params }) => {
					if (!isMocked("DELETE", "/me/roadmap/semesters/courses"))
						return passthrough();
					const semester = mockSemesters.find(
						(s) => s.semesterKey === params.key,
					);
					if (!semester) return notFound();
					const idx = semester.courses.findIndex(
						(c) => c.courseId === params.courseId,
					);
					if (idx >= 0) {
						semester.totalCredits -= semester.courses[idx].credits;
						semester.courses.splice(idx, 1);
					}
					return new HttpResponse(null, { status: 204 });
				},
			),
		];
	})(),
	http.get(`/api/${API_VERSION}/me/recommendations`, ({ request }) => {
		if (!isMocked("GET", "/me/recommendations")) return passthrough();
		const url = new URL(request.url);
		return HttpResponse.json(
			toRecommendationList(
				filterRecommendations(currentRecommendations, url.searchParams),
			),
		);
	}),

	http.post(`/api/${API_VERSION}/me/recommendations`, () => {
		if (!isMocked("POST", "/me/recommendations")) return passthrough();
		currentRecommendations = personalizedRecommendations;
		recommendationsGeneratedAt = PERSONALIZED_RECOMMENDATIONS_GENERATED_AT;
		return HttpResponse.json(toRecommendationList(currentRecommendations));
	}),

	http.get(`/api/${API_VERSION}/me`, () => {
		if (!isMocked("GET", "/me")) return passthrough();
		return HttpResponse.json(mockProfile);
	}),

	http.put(`/api/${API_VERSION}/me`, async ({ request }) => {
		if (!isMocked("PUT", "/me")) return passthrough();
		const body = (await request.json()) as Record<string, unknown>;
		mockProfile = {
			...mockProfile,
			...body,
			updatedAt: new Date().toISOString(),
		};
		return HttpResponse.json(mockProfile);
	}),

	http.patch(`/api/${API_VERSION}/me`, async ({ request }) => {
		if (!isMocked("PATCH", "/me")) return passthrough();
		const body = (await request.json()) as Record<string, unknown>;
		mockProfile = {
			...mockProfile,
			...body,
			updatedAt: new Date().toISOString(),
		};
		return HttpResponse.json(mockProfile);
	}),

	http.post(`/api/${API_VERSION}/me/transcript/upload`, async () => {
		if (!isMocked("POST", "/me/transcript/upload")) return passthrough();
		await delay(1500);
		return HttpResponse.json({
			importedCount: 5,
			skippedCount: 2,
			importedCourses: [
				{
					courseCode: "IN0001",
					courseName: "Introduction to Informatics 1",
					grade: "1.3",
					credits: 6,
				},
				{
					courseCode: "IN0003",
					courseName: "Introduction to Informatics 2",
					grade: "1.7",
					credits: 6,
				},
				{
					courseCode: "MA0901",
					courseName: "Linear Algebra for Informatics",
					grade: "2.0",
					credits: 8,
				},
				{
					courseCode: "IN0007",
					courseName: "Fundamentals: Algorithms and Data Structures",
					grade: "1.0",
					credits: 6,
				},
				{
					courseCode: "IN0009",
					courseName: "Fundamentals: Operating Systems and System Software",
					grade: "2.3",
					credits: 6,
				},
			],
			errors: [],
			unmatchedModules: [
				{
					moduleId: "XX9999",
					titleEn: "Advanced Topics in Quantum Computing",
					titleDe: "Fortgeschrittene Themen der Quanteninformatik",
					grade: "1.7",
					credits: 5,
				},
				{
					moduleId: "MA1234",
					titleEn: "Topology for Engineers",
					titleDe: "Topologie für Ingenieure",
					grade: "2.3",
					credits: 4,
				},
			],
		});
	}),

	http.get(`/api/${API_VERSION}/me/progress`, () => {
		if (!isMocked("GET", "/me/progress")) return passthrough();
		const totalEarned = getTotalCompletedCredits();
		const totalRequired = 180;
		const grades = mockCompletedCourses.map((c) => c.grade);
		const gpa =
			grades.length > 0 ? grades.reduce((s, g) => s + g, 0) / grades.length : 0;
		return HttpResponse.json({
			totalCreditsEarned: totalEarned,
			totalCreditsRequired: totalRequired,
			gpa: Math.round(gpa * 100) / 100,
			completedCourseCount: mockCompletedCourses.length,
			enrolledCourseCount: mockEnrolledCourses.length,
			currentSemester: "SS2025",
			progressPercentage: Math.round((totalEarned / totalRequired) * 1000) / 10,
			creditsByCategory: getCreditsByCategory(),
		});
	}),
	http.get(`/api/${API_VERSION}/courses/:courseid`,({})=>{
		throw new Error("should not happen");
	}),
	http.get(`/api/${API_VERSION}/me/courses/completed`, ({ request }) => {
		if (!isMocked("GET", "/me/courses/completed")) return passthrough();
		const url = new URL(request.url);
		const page = Number(url.searchParams.get("page") ?? "0");
		const size = Number(url.searchParams.get("size") ?? "10");
		const start = page * size;
		const content = mockCompletedCourses.slice(start, start + size);
		return HttpResponse.json({
			content,
			totalElements: mockCompletedCourses.length,
			totalPages: Math.ceil(mockCompletedCourses.length / size),
			number: page,
			size,
			first: page === 0,
			last: start + size >= mockCompletedCourses.length,
			empty: content.length === 0,
		});
	}),

	http.post(`/api/${API_VERSION}/me/courses/completed`, async ({ request }) => {
		if (!isMocked("POST", "/me/courses/completed")) return passthrough();
		const body = (await request.json()) as {
			courseId?: string;
			grade?: number;
			semester?: string;
		};
		const newCourse = {
			courseId: body.courseId ?? `c${mockCompletedCourses.length + 1}`,
			courseCode: (body.courseId ?? "NEW001").toUpperCase(),
			courseName: `Course ${body.courseId}`,
			credits: 6,
			grade: body.grade ?? 2.0,
			semester: body.semester ?? "SS2025",
			category: "Elective",
		};
		mockCompletedCourses = [newCourse, ...mockCompletedCourses];
		return HttpResponse.json(newCourse, { status: 201 });
	}),

	http.delete(
		`/api/${API_VERSION}/me/courses/completed/:courseId`,
		({ params }) => {
			if (!isMocked("DELETE", "/me/courses/completed")) return passthrough();
			mockCompletedCourses = mockCompletedCourses.filter(
				(c) => c.courseId !== params.courseId,
			);
			return new HttpResponse(null, { status: 204 });
		},
	),

	http.get(`/api/${API_VERSION}/me/courses/enrolled`, ({ request }) => {
		if (!isMocked("GET", "/me/courses/enrolled")) return passthrough();
		const url = new URL(request.url);
		const page = Number(url.searchParams.get("page") ?? "0");
		const size = Number(url.searchParams.get("size") ?? "10");
		const start = page * size;
		const content = mockEnrolledCourses.slice(start, start + size);
		return HttpResponse.json({
			content,
			totalElements: mockEnrolledCourses.length,
			totalPages: Math.ceil(mockEnrolledCourses.length / size),
			number: page,
			size,
			first: page === 0,
			last: start + size >= mockEnrolledCourses.length,
			empty: content.length === 0,
		});
	}),

	http.post(`/api/${API_VERSION}/me/courses/enrolled`, async ({ request }) => {
		if (!isMocked("POST", "/me/courses/enrolled")) return passthrough();
		const body = (await request.json()) as {
			courseId?: string;
			semester?: string;
		};
		const newCourse = {
			courseId: body.courseId ?? `e${mockEnrolledCourses.length + 1}`,
			courseCode: (body.courseId ?? "NEW001").toUpperCase(),
			courseName: `Course ${body.courseId}`,
			credits: 6,
			semester: body.semester ?? "SS2025",
			schedule: [],
		};
		mockEnrolledCourses = [newCourse, ...mockEnrolledCourses];
		return HttpResponse.json(newCourse, { status: 201 });
	}),

	http.delete(
		`/api/${API_VERSION}/me/courses/enrolled/:courseId`,
		({ params }) => {
			if (!isMocked("DELETE", "/me/courses/enrolled")) return passthrough();
			mockEnrolledCourses = mockEnrolledCourses.filter(
				(c) => c.courseId !== params.courseId,
			);
			return new HttpResponse(null, { status: 204 });
		},
	),

	http.get(`/api/${API_VERSION}/me/requirements`, () => {
		if (!isMocked("GET", "/me/requirements")) return passthrough();
		return HttpResponse.json({
			studyProgram: { id: "sp1", name: "Informatics B.Sc." },
			totalCreditsRequired: 180,
			totalCreditsEarned: getTotalCompletedCredits(),
			categories: [
				{
					name: "Core Modules",
					creditsRequired: 72,
					creditsEarned: getCompletedCreditsForCategory("Core"),
					fulfilled: getCompletedCreditsForCategory("Core") >= 72,
					courses: [
						{
							courseId: "c1",
							courseCode: "IN0001",
							courseName: "Introduction to Informatics 1",
							credits: 8,
							status: getRequirementStatus("c1"),
							isRequired: true,
						},
						{
							courseId: "c2",
							courseCode: "IN0002",
							courseName: "Introduction to Informatics 2",
							credits: 8,
							status: getRequirementStatus("c2"),
							isRequired: true,
						},
						{
							courseId: "c4",
							courseCode: "IN0003",
							courseName: "Algorithms and Data Structures",
							credits: 6,
							status: getRequirementStatus("c4"),
							isRequired: true,
						},
						{
							courseId: "e3",
							courseCode: "IN2322",
							courseName: "Advanced Algorithms",
							credits: 8,
							status: getRequirementStatus("e3"),
							isRequired: true,
						},
						{
							courseId: "m1",
							courseCode: "IN0004",
							courseName: "Formal Languages",
							credits: 6,
							status: getRequirementStatus("m1"),
							isRequired: true,
						},
					],
				},
				{
					name: "Electives",
					creditsRequired: 30,
					creditsEarned: getCompletedCreditsForCategory("Elective"),
					fulfilled: getCompletedCreditsForCategory("Elective") >= 30,
					courses: [
						{
							courseId: "c5",
							courseCode: "IN2346",
							courseName: "Introduction to Deep Learning",
							credits: 6,
							status: getRequirementStatus("c5"),
							isRequired: false,
						},
						{
							courseId: "e1",
							courseCode: "IN2349",
							courseName: "Advanced Deep Learning",
							credits: 6,
							status: getRequirementStatus("e1"),
							isRequired: false,
						},
						{
							courseId: "e2",
							courseCode: "IN2390",
							courseName: "Robot Learning",
							credits: 6,
							status: getRequirementStatus("e2"),
							isRequired: false,
						},
					],
				},
				{
					name: "Mathematics",
					creditsRequired: 18,
					creditsEarned: getCompletedCreditsForCategory("Mathematics"),
					fulfilled: getCompletedCreditsForCategory("Mathematics") >= 18,
					courses: [
						{
							courseId: "c3",
							courseCode: "MA0001",
							courseName: "Linear Algebra",
							credits: 8,
							status: getRequirementStatus("c3"),
							isRequired: true,
						},
						{
							courseId: "c6",
							courseCode: "MA0002",
							courseName: "Analysis",
							credits: 8,
							status: getRequirementStatus("c6"),
							isRequired: true,
						},
						{
							courseId: "m2",
							courseCode: "MA0003",
							courseName: "Discrete Probability",
							credits: 2,
							status: getRequirementStatus("m2"),
							isRequired: true,
						},
					],
				},
				{
					name: "Thesis",
					creditsRequired: 30,
					creditsEarned: getCompletedCreditsForCategory("Thesis"),
					fulfilled: false,
					courses: [
						{
							courseId: "m3",
							courseCode: "IN9999",
							courseName: "Bachelor's Thesis",
							credits: 30,
							status: getRequirementStatus("m3"),
							isRequired: true,
						},
					],
				},
			],
			alerts: [
				{
					type: "WARNING",
					message: "Missing prerequisite IN0004 for IN2322",
				},
				{
					type: "WARNING",
					message: "Thesis must be completed by SS2026 to graduate on time",
				},
			],
		});
	}),

	http.get(`/api/${API_VERSION}/me/dashboard`, () => {
		if (!isMocked("GET", "/me/dashboard")) return passthrough();
		return HttpResponse.json({
			progress: {
				totalCreditsEarned: 84,
				totalCreditsRequired: 180,
				progressPercentage: 46.7,
				gpa: 2.1,
				currentSemester: "WS2025",
			},
			semesterCredits: 30,
			alerts: [
				{
					type: "DEADLINE",
					severity: "ERROR",
					message: "Registration for exam IN0001 closes in 2 days.",
					relatedEntityId: "in0001",
					relatedEntityType: "COURSE",
				},
				{
					type: "PREREQUISITE_WARNING",
					severity: "WARNING",
					message: "You are missing a prerequisite for Advanced Algorithms.",
					relatedEntityId: "in2322",
					relatedEntityType: "COURSE",
				},
				{
					type: "WORKLOAD",
					severity: "INFO",
					message:
						"Your estimated weekly workload is 42 hours — above average.",
				},
			],
			recommendations: [
				{
					courseId: "in0001",
					courseCode: "IN0001",
					courseName: "Fundamentals of Programming",
					relevanceScore: 0.97,
					reason:
						"Core requirement for your Computer Science degree, not yet completed.",
				},
				{
					courseId: "in2322",
					courseCode: "IN2322",
					courseName: "Advanced Algorithms",
					relevanceScore: 0.88,
					reason:
						"Highly rated by students with your profile. Builds on Algorithms & Data Structures.",
				},
				{
					courseId: "in0012",
					courseCode: "IN0012",
					courseName: "Database Systems",
					relevanceScore: 0.82,
					reason:
						"Prerequisite for several courses in your remaining curriculum.",
				},
			],
			requirements: [
				{ name: "Core · Informatics", earned: 67, total: 72 },
				{ name: "Electives · Informatics", earned: 6, total: 30 },
				{ name: "Electives · Application", earned: 8, total: 18 },
				{ name: "Mathematics", earned: 5, total: 8 },
			],
			upcomingCourses: [
				{
					courseId: "in0001",
					courseCode: "IN0001",
					courseName: "Fundamentals of Programming",
					nextSession: {
						day: "MONDAY",
						startTime: "08:00",
						room: "MI 01.06.011",
					},
				},
				{
					courseId: "in2322",
					courseCode: "IN2322",
					courseName: "Advanced Algorithms",
					nextSession: {
						day: "TUESDAY",
						startTime: "14:00",
						room: "MW 2001",
					},
				},
				{
					courseId: "in0012",
					courseCode: "IN0012",
					courseName: "Database Systems",
					nextSession: {
						day: "THURSDAY",
						startTime: "10:00",
						room: "MI 00.08.038",
					},
				},
			],
		});
	}),
];
