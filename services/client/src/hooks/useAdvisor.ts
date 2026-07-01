import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	createConversation,
	getConversation,
	getConversations,
	getSuggestions,
	sendMessage,
} from "#/api/advisor";
import type {
	Conversation,
	ConversationMessage,
	IsoDateString,
} from "#/api/types";

export function useConversations() {
	return useInfiniteQuery({
		queryKey: ["conversations"],
		queryFn: ({ pageParam = 0 }) => getConversations(pageParam),
		getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
		initialPageParam: 0,
	});
}

export function useConversation(id: string | undefined) {
	return useQuery({
		queryKey: ["conversations", id],
		queryFn: () => getConversation(id as string),
		enabled: !!id,
	});
}

export function useSuggestions() {
	return useQuery({
		queryKey: ["advisor", "suggestions"],
		queryFn: getSuggestions,
		staleTime: 300_000,
	});
}

export function useSendMessage(conversationId: string) {
	const queryClient = useQueryClient();
	const [streamingContent, setStreamingContent] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
		};
	}, []);

	const mutation = useMutation({
		mutationFn: async (content: string) => {
			abortRef.current = new AbortController();
			setIsStreaming(true);
			setStreamingContent("");

			const userMessage: ConversationMessage = {
				id: `temp-${crypto.randomUUID()}`,
				role: "USER",
				content,
				referencedCourses: [],
				createdAt: new Date().toISOString() as IsoDateString,
			};

			queryClient.setQueryData<Conversation>(
				["conversations", conversationId],
				(old) => {
					if (!old) return old;
					return { ...old, messages: [...old.messages, userMessage] };
				},
			);

			let accumulated = "";

			for await (const event of sendMessage(
				conversationId,
				content,
				abortRef.current.signal,
			)) {
				if ("token" in event) {
					accumulated += event.token;
					setStreamingContent(accumulated);
				} else if ("done" in event) {
					const assistantMessage: ConversationMessage = {
						id: `msg-${crypto.randomUUID()}`,
						role: "ASSISTANT",
						content: event.fullContent,
						referencedCourses: [],
						createdAt: new Date().toISOString() as IsoDateString,
					};

					queryClient.setQueryData<Conversation>(
						["conversations", conversationId],
						(old) => {
							if (!old) return old;
							return {
								...old,
								messages: [...old.messages, assistantMessage],
							};
						},
					);
				} else if ("error" in event) {
					throw new Error(event.error);
				}
			}
		},
		onSettled: () => {
			setIsStreaming(false);
			setStreamingContent("");
			abortRef.current = null;
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});

	const cancel = useCallback(() => {
		abortRef.current?.abort();
	}, []);

	return {
		sendMessage: mutation.mutate,
		isStreaming,
		streamingContent,
		cancel,
		error: mutation.error,
	};
}

export function useCreateConversation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (title?: string) => createConversation(title),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});
}
