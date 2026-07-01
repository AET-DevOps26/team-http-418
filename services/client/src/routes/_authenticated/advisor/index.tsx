import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { SuggestionChips } from "#/components/advisor/SuggestionChips";
import { useCreateConversation } from "#/hooks/useAdvisor";

export const Route = createFileRoute("/_authenticated/advisor/")({
	component: AdvisorIndex,
});

function AdvisorIndex() {
	const navigate = useNavigate();
	const createConversation = useCreateConversation();
	const [pending, setPending] = useState(false);

	async function handleSelect(text: string) {
		if (pending) return;
		setPending(true);
		try {
			const conv = await createConversation.mutateAsync(undefined);
			navigate({
				to: "/advisor/$conversationId",
				params: { conversationId: conv.id },
				search: { prompt: text },
			});
		} finally {
			setPending(false);
		}
	}

	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 40,
				gap: 32,
			}}
		>
			<div style={{ textAlign: "center" }}>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: "var(--r-lg)",
						background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						margin: "0 auto 16px",
					}}
				>
					<Sparkles size={24} strokeWidth={1.75} color="#fff" />
				</div>
				<h2
					style={{
						margin: "0 0 6px",
						fontSize: 20,
						fontWeight: 700,
						color: "var(--ink)",
					}}
				>
					AIDAN Advisor
				</h2>
				<p
					style={{
						margin: 0,
						fontSize: 14,
						color: "var(--muted)",
						maxWidth: 360,
					}}
				>
					Your AI academic advisor. Ask about courses, degree progress,
					scheduling, or career planning.
				</p>
			</div>

			<div style={{ maxWidth: 520, width: "100%" }}>
				<SuggestionChips onSelect={handleSelect} />
			</div>
		</div>
	);
}
