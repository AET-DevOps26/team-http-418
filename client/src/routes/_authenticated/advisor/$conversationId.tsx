import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { MessageInput } from "#/components/advisor/MessageInput";
import { MessageThread } from "#/components/advisor/MessageThread";
import { SuggestionChips } from "#/components/advisor/SuggestionChips";
import { useConversation, useSendMessage } from "#/hooks/useAdvisor";

type SearchParams = {
	prompt?: string;
};

export const Route = createFileRoute("/_authenticated/advisor/$conversationId")(
	{
		component: ConversationPage,
		validateSearch: (search: Record<string, unknown>): SearchParams => ({
			prompt: (search.prompt as string) || undefined,
		}),
	},
);

function ConversationSkeleton() {
	return (
		<div
			style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
		>
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					style={{
						display: "flex",
						justifyContent: i % 2 === 0 ? "flex-end" : "flex-start",
					}}
				>
					<div
						className="skel"
						style={{
							height: 40,
							width: i % 2 === 0 ? 200 : 280,
							borderRadius: "var(--r-lg)",
						}}
					/>
				</div>
			))}
		</div>
	);
}

function ConversationPage() {
	const { conversationId } = Route.useParams();
	const { prompt } = Route.useSearch();
	const { data, isLoading, isError, refetch } = useConversation(conversationId);
	const { sendMessage, isStreaming, streamingContent } =
		useSendMessage(conversationId);
	const initialPromptSent = useRef(false);

	useEffect(() => {
		if (prompt && data && !initialPromptSent.current) {
			initialPromptSent.current = true;
			sendMessage(prompt);
		}
	}, [prompt, data, sendMessage]);

	if (isLoading) return <ConversationSkeleton />;

	if (isError) {
		return (
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p style={{ color: "var(--muted)", marginBottom: 12, fontSize: 14 }}>
						Failed to load conversation.
					</p>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => refetch()}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	const messages = data?.messages ?? [];
	const isEmpty = messages.length === 0 && !isStreaming;

	return (
		<>
			{isEmpty ? (
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: 40,
					}}
				>
					<p
						style={{
							color: "var(--muted)",
							fontSize: 14,
							marginBottom: 24,
						}}
					>
						Start the conversation with a question or pick a suggestion.
					</p>
					<div style={{ maxWidth: 480, width: "100%" }}>
						<SuggestionChips onSelect={(text) => sendMessage(text)} />
					</div>
				</div>
			) : (
				<MessageThread
					messages={messages}
					streamingContent={streamingContent}
					isStreaming={isStreaming}
				/>
			)}
			<MessageInput
				onSend={(content) => sendMessage(content)}
				disabled={isStreaming}
			/>
		</>
	);
}
