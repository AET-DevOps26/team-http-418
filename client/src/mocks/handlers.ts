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
			totalPlannedCredits: 180,
			estimatedGraduation: "SS2026",
		});

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

			http.post(
				`/api/${API_VERSION}/me/roadmap/semesters/:key/courses`,
				async ({ params, request }) => {
					if (!isMocked("POST", "/me/roadmap/semesters/courses"))
						return passthrough();
					const body = (await request.json()) as { courseId: string };
					const semester = mockSemesters.find(
						(s) => s.semesterKey === params.key,
					);
					if (!semester)
						return HttpResponse.json(
							{ type: "about:blank", title: "Not Found", status: 404 },
							{ status: 404 },
						);
					semester.courses.push({
						courseId: body.courseId,
						courseCode: body.courseId.toUpperCase(),
						courseName: "New Course",
						credits: 5,
						status: "PLANNED",
					});
					semester.totalCredits += 5;
					return HttpResponse.json(semester);
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
					if (!semester)
						return HttpResponse.json(
							{ type: "about:blank", title: "Not Found", status: 404 },
							{ status: 404 },
						);
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
