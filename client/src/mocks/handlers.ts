import { delay, HttpResponse, http, passthrough } from "msw";
import { API_VERSION } from "#/api/auth.ts";
import type { Recommendation, RecommendationList } from "#/api/types";
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
			errors: ["Could not match course 'XX9999' to catalog"],
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
