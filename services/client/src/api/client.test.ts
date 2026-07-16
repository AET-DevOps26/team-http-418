import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "#/api/client";

vi.mock("#/api/auth", () => ({
	getAccessToken: vi.fn(() => null),
	refreshAccessToken: vi.fn(async () => null),
	clearAccessToken: vi.fn(),
	setAccessToken: vi.fn(),
	API_VERSION: "v1",
}));

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function textResponse(body: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: { "Content-Type": "text/plain" },
	});
}

function emptyResponse(): Response {
	return new Response(null, { status: 204 });
}

describe("ApiError", () => {
	it("stores status and uses title as message", () => {
		const problem = { type: "about:blank", title: "Not Found", status: 404 };
		const err = new ApiError(404, problem);

		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("ApiError");
		expect(err.status).toBe(404);
		expect(err.problem).toBe(problem);
		expect(err.message).toBe("Not Found");
	});

	it("prefers detail over title as message", () => {
		const problem = {
			type: "about:blank",
			title: "Bad Request",
			status: 400,
			detail: "Name is required",
		};
		const err = new ApiError(400, problem);

		expect(err.message).toBe("Name is required");
	});
});

describe("apiFetch", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("attaches Authorization header when token is present", async () => {
		const { getAccessToken } = await import("#/api/auth");
		vi.mocked(getAccessToken).mockReturnValue("test-token");
		vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1 }));

		await apiFetch("/items");

		const [, init] = vi.mocked(fetch).mock.calls[0];
		expect((init?.headers as Headers).get("Authorization")).toBe(
			"Bearer test-token",
		);
	});

	it("omits Authorization header when no token", async () => {
		const { getAccessToken } = await import("#/api/auth");
		vi.mocked(getAccessToken).mockReturnValue(null);
		vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1 }));

		await apiFetch("/items");

		const [, init] = vi.mocked(fetch).mock.calls[0];
		expect((init?.headers as Headers).get("Authorization")).toBeNull();
	});

	it("parses JSON response by default", async () => {
		vi.mocked(fetch).mockResolvedValue(jsonResponse({ name: "test" }));

		const result = await apiFetch<{ name: string }>("/items");

		expect(result).toEqual({ name: "test" });
	});

	it("returns undefined for 204 No Content", async () => {
		vi.mocked(fetch).mockResolvedValue(emptyResponse());

		const result = await apiFetch<void>("/items/1", { method: "DELETE" });

		expect(result).toBeUndefined();
	});

	it("returns undefined for 200 OK with empty body", async () => {
		vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

		const result = await apiFetch<void>("/items/1", { method: "PUT" });

		expect(result).toBeUndefined();
	});

	it("returns text when responseType is 'text'", async () => {
		vi.mocked(fetch).mockResolvedValue(textResponse("hello world"));

		const result = await apiFetch<string>("/hello", { responseType: "text" });

		expect(result).toBe("hello world");
	});

	it("sets Accept: text/plain for responseType 'text'", async () => {
		vi.mocked(fetch).mockResolvedValue(textResponse("hello"));

		await apiFetch<string>("/hello", { responseType: "text" });

		const [, init] = vi.mocked(fetch).mock.calls[0];
		expect((init?.headers as Headers).get("Accept")).toBe("text/plain");
	});

	it("throws ApiError on non-ok response", async () => {
		const problem = { type: "about:blank", title: "Not Found", status: 404 };
		vi.mocked(fetch).mockResolvedValue(jsonResponse(problem, 404));

		await expect(apiFetch("/items/999")).rejects.toBeInstanceOf(ApiError);
		await expect(apiFetch("/items/999")).rejects.toMatchObject({ status: 404 });
	});

	it("retries with new token after 401 and refresh succeeds", async () => {
		const { refreshAccessToken, setAccessToken } = await import("#/api/auth");
		vi.mocked(refreshAccessToken).mockResolvedValueOnce("new-token");
		vi.mocked(fetch)
			.mockResolvedValueOnce(new Response(null, { status: 401 }))
			.mockResolvedValueOnce(jsonResponse({ id: 1 }));

		const result = await apiFetch<{ id: number }>("/items/1");

		expect(result).toEqual({ id: 1 });
		expect(setAccessToken).toHaveBeenCalledWith("new-token");
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("clears token and throws after 401 when refresh returns null", async () => {
		const { refreshAccessToken, clearAccessToken } = await import("#/api/auth");
		vi.mocked(refreshAccessToken).mockResolvedValueOnce(null);
		const problem = { type: "about:blank", title: "Unauthorized", status: 401 };
		vi.mocked(fetch).mockResolvedValue(jsonResponse(problem, 401));

		await expect(apiFetch("/items/1")).rejects.toMatchObject({ status: 401 });
		expect(clearAccessToken).toHaveBeenCalled();
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
