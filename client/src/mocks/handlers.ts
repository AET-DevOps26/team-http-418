import { HttpResponse, http, passthrough } from "msw";
import { isMocked } from "./config";
import {API_VERSION} from "#/api/auth.ts";

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
