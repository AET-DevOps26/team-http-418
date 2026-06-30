import { getAccessToken, refreshAccessToken, setAccessToken } from "#/api/auth";
import { apiFetch } from "#/api/client";
import type {
	AdvisorSSEEvent,
	Conversation,
	ConversationSummary,
	Page,
	SuggestedPrompt,
} from "#/api/types";

export function getConversations(page = 0): Promise<Page<ConversationSummary>> {
	return apiFetch<Page<ConversationSummary>>(
		`/me/advisor/conversations?page=${page}`,
	);
}

export function createConversation(title?: string): Promise<Conversation> {
	return apiFetch<Conversation>("/me/advisor/conversations", {
		method: "POST",
		body: JSON.stringify(title ? { title } : {}),
	});
}

export function getConversation(id: string): Promise<Conversation> {
	return apiFetch<Conversation>(`/me/advisor/conversations/${id}`);
}

export function getSuggestions(): Promise<SuggestedPrompt[]> {
	return apiFetch<SuggestedPrompt[]>("/me/advisor/suggestions");
}

export async function* sendMessage(
	conversationId: string,
	content: string,
	signal?: AbortSignal,
): AsyncGenerator<AdvisorSSEEvent> {
	const doRequest = async (token: string | null) => {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		};
		if (token) headers.Authorization = `Bearer ${token}`;

		return apiFetch(`/me/advisor/conversations/${conversationId}/messages`, {
			method: "POST",
			headers,
			body: JSON.stringify({ content }),
			signal,
		});
	};

	let res = await doRequest(getAccessToken());

	if (res.status === 401) {
		const newToken = await refreshAccessToken();
		if (newToken) {
			setAccessToken(newToken);
			res = await doRequest(newToken);
		}
	}

	if (!res.ok) {
		throw new Error(`Advisor request failed: ${res.status}`);
	}

	if (!res.body) throw new Error("No response body");
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			const parts = buffer.split("\n\n");
			buffer = parts.pop() ?? "";

			for (const part of parts) {
				const line = part.trim();
				if (!line.startsWith("data: ")) continue;
				const json = line.slice(6);
				yield JSON.parse(json) as AdvisorSSEEvent;
			}
		}

		if (buffer.trim()) {
			const line = buffer.trim();
			if (line.startsWith("data: ")) {
				yield JSON.parse(line.slice(6)) as AdvisorSSEEvent;
			}
		}
	} finally {
		reader.releaseLock();
	}
}
