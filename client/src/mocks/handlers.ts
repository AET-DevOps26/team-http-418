import { HttpResponse, http, passthrough } from "msw";
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
