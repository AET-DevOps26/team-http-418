import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { GenerateRoadmapRequest } from "#/api/types";

type Props = {
	open: boolean;
	onClose: () => void;
	onSubmit: (req: GenerateRoadmapRequest) => void;
};

export function GenerateRoadmapModal({ open, onClose, onSubmit }: Props) {
	const ref = useRef<HTMLDialogElement>(null);
	const [aims, setAims] = useState("");
	const [maxCredits, setMaxCredits] = useState(30);
	const [interests, setInterests] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	}, [open]);

	function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && tagInput.trim()) {
			e.preventDefault();
			setInterests((prev) => [...prev, tagInput.trim()]);
			setTagInput("");
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		onSubmit({ aims, maxCreditsPerSemester: maxCredits, interests });
		onClose();
	}

	return (
		<dialog ref={ref} className="modal" onClose={onClose}>
			<form onSubmit={handleSubmit}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 20,
					}}
				>
					<h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
						Generate Roadmap
					</h2>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "var(--muted)",
						}}
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				<label
					htmlFor="roadmap-aims"
					style={{
						display: "block",
						fontSize: 13,
						fontWeight: 500,
						marginBottom: 6,
					}}
				>
					Academic aims
				</label>
				<textarea
					id="roadmap-aims"
					value={aims}
					onChange={(e) => setAims(e.target.value)}
					placeholder="e.g. Graduate by Summer 2026, focus on AI…"
					rows={3}
					style={{
						width: "100%",
						borderRadius: "var(--r-md)",
						border: "1px solid var(--line)",
						padding: "8px 10px",
						fontSize: 13,
						fontFamily: "var(--font-sans)",
						resize: "vertical",
						marginBottom: 16,
					}}
				/>

				<label
					htmlFor="roadmap-max-credits"
					style={{
						display: "block",
						fontSize: 13,
						fontWeight: 500,
						marginBottom: 6,
					}}
				>
					Max credits per semester
				</label>
				<input
					id="roadmap-max-credits"
					type="number"
					value={maxCredits}
					onChange={(e) => setMaxCredits(Number(e.target.value))}
					min={10}
					max={45}
					style={{
						width: 80,
						borderRadius: "var(--r-md)",
						border: "1px solid var(--line)",
						padding: "6px 10px",
						fontSize: 13,
						fontFamily: "var(--font-mono)",
						marginBottom: 16,
					}}
				/>

				<label
					htmlFor="roadmap-interests"
					style={{
						display: "block",
						fontSize: 13,
						fontWeight: 500,
						marginBottom: 6,
					}}
				>
					Interests
				</label>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 6,
						marginBottom: 8,
					}}
				>
					{interests.map((tag) => (
						<span
							key={tag}
							className="tag"
							style={{
								background: "var(--blue-100)",
								color: "var(--blue-800)",
							}}
						>
							{tag}
							<button
								type="button"
								onClick={() =>
									setInterests((prev) => prev.filter((t) => t !== tag))
								}
								style={{
									background: "none",
									border: "none",
									cursor: "pointer",
									padding: 0,
									color: "inherit",
									fontSize: 13,
									lineHeight: 1,
								}}
								aria-label={`Remove ${tag}`}
							>
								×
							</button>
						</span>
					))}
				</div>
				<input
					id="roadmap-interests"
					value={tagInput}
					onChange={(e) => setTagInput(e.target.value)}
					onKeyDown={handleTagKeyDown}
					placeholder="Type and press Enter…"
					style={{
						width: "100%",
						borderRadius: "var(--r-md)",
						border: "1px solid var(--line)",
						padding: "6px 10px",
						fontSize: 13,
						fontFamily: "var(--font-sans)",
						marginBottom: 24,
					}}
				/>

				<div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
					<button type="button" className="btn btn-ghost" onClick={onClose}>
						Cancel
					</button>
					<button type="submit" className="btn btn-primary">
						Generate
					</button>
				</div>
			</form>
		</dialog>
	);
}
