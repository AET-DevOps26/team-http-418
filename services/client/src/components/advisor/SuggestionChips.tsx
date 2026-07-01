import { useSuggestions } from "#/hooks/useAdvisor";

type Props = {
	onSelect: (text: string) => void;
};

export function SuggestionChips({ onSelect }: Props) {
	const { data: suggestions, isLoading } = useSuggestions();

	if (isLoading) {
		return (
			<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
				{[0, 1, 2, 3].map((i) => (
					<div
						key={i}
						className="skel"
						style={{ height: 40, width: 180, borderRadius: "var(--r-lg)" }}
					/>
				))}
			</div>
		);
	}

	if (!suggestions?.length) return null;

	const grouped = suggestions.reduce<Record<string, string[]>>((acc, s) => {
		if (!acc[s.category]) acc[s.category] = [];
		acc[s.category].push(s.text);
		return acc;
	}, {});

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			{Object.entries(grouped).map(([category, texts]) => (
				<div key={category}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							color: "var(--muted)",
							marginBottom: 8,
						}}
					>
						{category}
					</div>
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						{texts.map((text) => (
							<button
								key={text}
								type="button"
								className="suggestion-chip"
								onClick={() => onSelect(text)}
							>
								{text}
							</button>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
