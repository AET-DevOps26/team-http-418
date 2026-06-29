import { useNavigate, useParams } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useConversations, useCreateConversation } from "#/hooks/useAdvisor";

function timeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	return `${days}d ago`;
}

export function ConversationList() {
	const navigate = useNavigate();
	const { conversationId } = useParams({ strict: false }) as {
		conversationId?: string;
	};
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
		useConversations();
	const createConversation = useCreateConversation();
	const [search, setSearch] = useState("");

	const conversations = data?.pages.flatMap((p) => p.content) ?? [];
	const filtered = search
		? conversations.filter(
				(c) =>
					c.title.toLowerCase().includes(search.toLowerCase()) ||
					c.lastMessage.toLowerCase().includes(search.toLowerCase()),
			)
		: conversations;

	async function handleNewChat() {
		const conv = await createConversation.mutateAsync(undefined);
		navigate({
			to: "/advisor/$conversationId",
			params: { conversationId: conv.id },
			search: {},
		});
	}

	return (
		<>
			<div
				style={{
					padding: "16px 16px 12px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid var(--line)",
				}}
			>
				<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
					Conversations
				</span>
				<button
					type="button"
					className="btn btn-ghost"
					onClick={handleNewChat}
					disabled={createConversation.isPending}
					style={{ padding: "5px 10px", fontSize: 12 }}
				>
					<Plus size={14} strokeWidth={2} /> New
				</button>
			</div>

			<div style={{ padding: "8px 12px" }}>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: "var(--canvas)",
						border: "1px solid var(--line)",
						borderRadius: "var(--r-md)",
						padding: "0 10px",
						height: 32,
					}}
				>
					<Search size={13} strokeWidth={2} style={{ color: "var(--muted)" }} />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search…"
						style={{
							border: "none",
							background: "transparent",
							outline: "none",
							fontSize: 12.5,
							color: "var(--ink)",
							fontFamily: "var(--font-sans)",
							flex: 1,
						}}
					/>
				</div>
			</div>

			<div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
				{filtered.map((conv) => (
					<button
						key={conv.id}
						type="button"
						onClick={() =>
							navigate({
								to: "/advisor/$conversationId",
								params: { conversationId: conv.id },
							})
						}
						style={{
							display: "block",
							width: "100%",
							textAlign: "left",
							padding: "10px 10px",
							borderRadius: "var(--r-md)",
							border: "none",
							cursor: "pointer",
							background:
								conv.id === conversationId ? "var(--blue-50)" : "transparent",
							fontFamily: "var(--font-sans)",
							transition: "background 0.1s",
						}}
						onMouseEnter={(e) => {
							if (conv.id !== conversationId)
								e.currentTarget.style.background = "var(--canvas)";
						}}
						onMouseLeave={(e) => {
							if (conv.id !== conversationId)
								e.currentTarget.style.background = "transparent";
						}}
					>
						<div
							style={{
								fontSize: 13,
								fontWeight: 500,
								color: "var(--ink)",
								marginBottom: 2,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{conv.title}
						</div>
						<div
							style={{
								fontSize: 12,
								color: "var(--muted)",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
								display: "flex",
								justifyContent: "space-between",
								gap: 8,
							}}
						>
							<span
								style={{
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{conv.lastMessage}
							</span>
							<span style={{ flexShrink: 0, fontSize: 11 }}>
								{timeAgo(conv.lastMessageAt)}
							</span>
						</div>
					</button>
				))}

				{hasNextPage && (
					<button
						type="button"
						className="btn btn-ghost"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						style={{
							width: "100%",
							justifyContent: "center",
							marginTop: 8,
							fontSize: 12,
						}}
					>
						{isFetchingNextPage ? "Loading…" : "Load more"}
					</button>
				)}
			</div>
		</>
	);
}
