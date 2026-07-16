import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { useGenerateRecommendations } from "#/hooks/useRecommendations";

type Props = {
	mutation: ReturnType<typeof useGenerateRecommendations>;
};

export function GenerateForm({ mutation }: Props) {
	const [goals, setGoals] = useState("");
	const [interests, setInterests] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		mutation.mutate({
			goals: goals.split(",") || [],
			interests: interests.split(",") || [],
		});
	}

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				background: "var(--paper)",
				border: "1px solid var(--line)",
				borderRadius: "var(--r-lg)",
				padding: "16px 20px",
				marginBottom: 20,
			}}
		>
			<div
				style={{
					fontSize: 12,
					fontWeight: 600,
					color: "var(--muted)",
					marginBottom: 12,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				Generate personalised recommendations
			</div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 12,
					marginBottom: 12,
				}}
			>
				<div>
					<label
						htmlFor="rec-goals"
						style={{
							fontSize: 12,
							fontWeight: 500,
							color: "var(--ink-soft)",
							display: "block",
							marginBottom: 4,
						}}
					>
						Goals
					</label>
					<input
						id="rec-goals"
						type="text"
						value={goals}
						onChange={(e) => setGoals(e.target.value)}
						placeholder="e.g. machine learning specialisation"
						style={{
							width: "100%",
							padding: "7px 10px",
							fontSize: 13,
							border: "1px solid var(--line)",
							borderRadius: "var(--r-md)",
							fontFamily: "var(--font-sans)",
							color: "var(--ink)",
							background: "var(--canvas)",
							outline: "none",
						}}
					/>
				</div>
				<div>
					<label
						htmlFor="rec-interests"
						style={{
							fontSize: 12,
							fontWeight: 500,
							color: "var(--ink-soft)",
							display: "block",
							marginBottom: 4,
						}}
					>
						Interests
					</label>
					<input
						id="rec-interests"
						type="text"
						value={interests}
						onChange={(e) => setInterests(e.target.value)}
						placeholder="e.g. distributed systems, databases"
						style={{
							width: "100%",
							padding: "7px 10px",
							fontSize: 13,
							border: "1px solid var(--line)",
							borderRadius: "var(--r-md)",
							fontFamily: "var(--font-sans)",
							color: "var(--ink)",
							background: "var(--canvas)",
							outline: "none",
						}}
					/>
				</div>
			</div>
			<button
				type="submit"
				className="btn btn-primary"
				disabled={mutation.isPending}
			>
				{mutation.isPending ? (
					<>
						<Loader2
							size={14}
							strokeWidth={2}
							style={{ animation: "spin 0.8s linear infinite" }}
						/>
						Generating…
					</>
				) : (
					"Generate"
				)}
			</button>
		</form>
	);
}
