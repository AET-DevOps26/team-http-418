import { HttpResponse, http, passthrough } from "msw";
import { API_VERSION } from "#/api/auth.ts";
import { isMocked } from "./config";

const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_REFRESH_TOKEN = "mock-refresh-token";

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

	http.get(`/api/${API_VERSION}/me/advisor/conversations`, () => {
		if (!isMocked("GET", "/me/advisor/conversations")) return passthrough();
		return HttpResponse.json({
			content: [
				{
					id: "conv-1",
					title: "Course recommendations for WS2025",
					lastMessage:
						"Based on your progress, I'd recommend taking IN2322 Advanced Algorithms next semester.",
					lastMessageAt: "2025-12-15T14:30:00Z",
					messageCount: 6,
				},
				{
					id: "conv-2",
					title: "Prerequisite check for Machine Learning",
					lastMessage:
						"You still need Linear Algebra (MA0902) before enrolling in Machine Learning.",
					lastMessageAt: "2025-12-14T09:15:00Z",
					messageCount: 4,
				},
				{
					id: "conv-3",
					title: "Semester workload planning",
					lastMessage:
						"Taking 32 credits would put you above the recommended workload.",
					lastMessageAt: "2025-12-12T16:45:00Z",
					messageCount: 8,
				},
			],
			totalElements: 3,
			totalPages: 1,
			number: 0,
			size: 20,
			first: true,
			last: true,
			empty: false,
		});
	}),

	http.post(`/api/${API_VERSION}/me/advisor/conversations`, () => {
		if (!isMocked("POST", "/me/advisor/conversations")) return passthrough();
		const id = `conv-${crypto.randomUUID().slice(0, 8)}`;
		return HttpResponse.json({
			id,
			title: "New conversation",
			messages: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	}),

	http.get(`/api/${API_VERSION}/me/advisor/conversations/:id`, ({ params }) => {
		if (!isMocked("GET", "/me/advisor/conversations/:id")) return passthrough();
		const id = params.id as string;
		const messages =
			id === "conv-1"
				? [
						{
							id: "msg-1",
							role: "USER",
							content: "What courses should I take next semester?",
							referencedCourses: [],
							createdAt: "2025-12-15T14:25:00Z",
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
							createdAt: "2025-12-15T14:25:30Z",
						},
						{
							id: "msg-3",
							role: "USER",
							content: "What about the workload if I take all three?",
							referencedCourses: [],
							createdAt: "2025-12-15T14:28:00Z",
						},
						{
							id: "msg-4",
							role: "ASSISTANT",
							content:
								"Taking all three would put you at roughly 24 credits, which is well within the recommended range of 28-32 credits per semester. The estimated weekly workload would be about 36 hours including lectures, tutorials, and self-study.\n\nHowever, note that Advanced Algorithms has a reputation for being demanding. If you want a lighter semester, you could swap it for a less intensive elective.",
							referencedCourses: [],
							createdAt: "2025-12-15T14:28:45Z",
						},
					]
				: [];

		return HttpResponse.json({
			id,
			title:
				id === "conv-1"
					? "Course recommendations for WS2025"
					: "New conversation",
			messages,
			createdAt: "2025-12-15T14:25:00Z",
			updatedAt: "2025-12-15T14:30:00Z",
		});
	}),

	http.post(
		`/api/${API_VERSION}/me/advisor/conversations/:id/messages`,
		async ({ request }) => {
			if (!isMocked("POST", "/me/advisor/conversations/:id/messages"))
				return passthrough();

			const body = (await request.json()) as { content: string };
			const tokens =
				`I understand you're asking about "${body.content.slice(0, 50)}". Let me help with that.\n\nBased on your academic profile, here's what I'd recommend:\n\n1. Review your current degree requirements to ensure you're on track.\n2. Consider your workload balance across the semester.\n3. Talk to your department advisor for course-specific guidance.\n\nWould you like me to go deeper on any of these points?`.split(
					"",
				);

			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					for (const token of tokens) {
						const event = JSON.stringify({ token });
						controller.enqueue(encoder.encode(`data: ${event}\n\n`));
						await new Promise((r) => setTimeout(r, 20));
					}
					const doneEvent = JSON.stringify({
						done: true,
						fullContent: tokens.join(""),
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
