import { Send } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

type Props = {
	onSend: (content: string) => void;
	disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: Props) {
	const [value, setValue] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	function handleSend() {
		const trimmed = value.trim();
		if (!trimmed || disabled) return;
		onSend(trimmed);
		setValue("");
		if (textareaRef.current) textareaRef.current.style.height = "auto";
	}

	function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleInput() {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
	}

	return (
		<div
			style={{
				padding: "12px 28px 20px",
				borderTop: "1px solid var(--line)",
				background: "var(--paper)",
				display: "flex",
				gap: 10,
				alignItems: "flex-end",
			}}
		>
			<textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				onInput={handleInput}
				placeholder="Ask AIDAN anything…"
				rows={1}
				disabled={disabled}
				style={{
					flex: 1,
					resize: "none",
					border: "1px solid var(--line)",
					borderRadius: "var(--r-lg)",
					padding: "10px 14px",
					fontSize: 13.5,
					fontFamily: "var(--font-sans)",
					lineHeight: 1.5,
					outline: "none",
					background: "var(--canvas)",
					color: "var(--ink)",
					maxHeight: 120,
				}}
			/>
			<button
				type="button"
				className="btn btn-primary"
				onClick={handleSend}
				disabled={!value.trim() || disabled}
				style={{
					padding: "9px 12px",
					opacity: !value.trim() || disabled ? 0.5 : 1,
				}}
			>
				<Send size={15} strokeWidth={2} />
			</button>
		</div>
	);
}
