import { X } from "lucide-react";
import { useState } from "react";

export function GoalsInterestsEditor({
	label,
	items,
	editing,
	onChange,
}: {
	label: string;
	items: string[];
	editing: boolean;
	onChange: (items: string[]) => void;
}) {
	const [inputValue, setInputValue] = useState("");

	function addItem() {
		const trimmed = inputValue.trim();
		if (!trimmed) return;
		if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
			setInputValue("");
			return;
		}
		onChange([...items, trimmed]);
		setInputValue("");
	}

	function removeItem(index: number) {
		onChange(items.filter((_, i) => i !== index));
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addItem();
		}
	}

	return (
		<div className="card" style={{ padding: 24 }}>
			<p className="eyebrow">{label}</p>
			<div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
				{items.map((item, i) => (
					<span
						key={item}
						className="tag"
						style={{
							background: "var(--blue-50)",
							color: "var(--blue-800)",
						}}
					>
						{item}
						{editing && (
							<button
								type="button"
								onClick={() => removeItem(i)}
								style={{
									background: "none",
									border: "none",
									padding: 0,
									cursor: "pointer",
									display: "inline-flex",
									color: "var(--blue-800)",
									marginLeft: 2,
								}}
							>
								<X size={12} />
							</button>
						)}
					</span>
				))}
			</div>
			{editing && (
				<div style={{ marginTop: 10 }}>
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={`Add ${label.toLowerCase()}…`}
						style={{
							width: "100%",
							padding: "7px 10px",
							fontSize: 13,
							fontFamily: "var(--font-sans)",
							border: "1px solid var(--line)",
							borderRadius: "var(--r-md)",
							background: "var(--paper)",
							color: "var(--ink)",
							outline: "none",
						}}
					/>
					<p
						style={{
							margin: "4px 0 0",
							fontSize: 11,
							color: "var(--muted)",
						}}
					>
						Press Enter or comma to add
					</p>
				</div>
			)}
		</div>
	);
}
