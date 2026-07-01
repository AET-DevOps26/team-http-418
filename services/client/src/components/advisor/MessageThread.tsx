import { useEffect, useRef } from "react";
import type { ConversationMessage } from "#/api/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

type Props = {
	messages: ConversationMessage[];
	streamingContent: string;
	isStreaming: boolean;
};

export function MessageThread({
	messages,
	streamingContent,
	isStreaming,
}: Props) {
	const bottomRef = useRef<HTMLDivElement>(null);

	const messageCount = messages.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message/stream changes
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messageCount, streamingContent]);

	return (
		<div
			style={{
				flex: 1,
				overflowY: "auto",
				padding: "24px 28px",
				display: "flex",
				flexDirection: "column",
				gap: 16,
			}}
		>
			{messages.map((msg) => (
				<MessageBubble
					key={msg.id}
					sender={msg.role}
					content={msg.content}
					referencedCourses={msg.referencedCourses}
				/>
			))}
			{isStreaming &&
				(streamingContent ? (
					<MessageBubble sender="ASSISTANT" content={streamingContent} />
				) : (
					<TypingIndicator />
				))}
			<div ref={bottomRef} />
		</div>
	);
}
