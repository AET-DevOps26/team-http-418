import { HttpResponse, http, passthrough } from "msw";
import { isMocked } from "./config";

const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_REFRESH_TOKEN = "mock-refresh-token";

export const handlers = [
	http.get("/api/hello", () => {
		if (!isMocked("GET", "/hello")) return passthrough();
		return new HttpResponse("hello world (mock)", {
			headers: { "Content-Type": "text/plain" },
		});
	}),

	http.post("/api/auth/login", async ({ request }) => {
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

	http.post("/api/auth/refresh", async () => {
		if (!isMocked("POST", "/auth/refresh")) return passthrough();
		return HttpResponse.json({
			accessToken: MOCK_ACCESS_TOKEN,
			refreshToken: MOCK_REFRESH_TOKEN,
			expiresIn: 3600,
		});
	}),

	http.post("/api/auth/logout", () => {
		if (!isMocked("POST", "/auth/logout")) return passthrough();
		return new HttpResponse(null, { status: 204 });
	}),
];
