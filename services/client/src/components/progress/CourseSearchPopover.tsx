import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCourses } from "#/api/courses";
import type { CourseSummary } from "#/api/types";

type Props = {
	onSelect: (course: CourseSummary) => void;
	onClose: () => void;
};

export function CourseSearchPopover({ onSelect, onClose }: Props) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<CourseSummary[]>([]);
	const [loading, setLoading] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) onClose();
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [onClose]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose]);

	function handleInput(value: string) {
		setQuery(value);
		if (timerRef.current) clearTimeout(timerRef.current);
		if (!value.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		timerRef.current = setTimeout(async () => {
			try {
				const page = await getCourses({ search: value, size: 10 });
				setResults(page.content);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	}

	return (
		<div ref={ref} className="resolve-popover">
			<input
				ref={inputRef}
				className="resolve-popover-input"
				placeholder="Search courses..."
				value={query}
				onChange={(e) => handleInput(e.target.value)}
			/>
			{loading && (
				<div
					style={{ padding: "12px", display: "flex", justifyContent: "center" }}
				>
					<Loader2
						size={16}
						color="var(--muted)"
						style={{ animation: "spin 1s linear infinite" }}
					/>
				</div>
			)}
			{!loading && query.trim() && results.length === 0 && (
				<div
					style={{
						padding: "10px 14px",
						fontSize: 12.5,
						color: "var(--muted)",
					}}
				>
					No results for "{query}"
				</div>
			)}
			{!loading &&
				results.map((c) => (
					<button
						key={c.id}
						type="button"
						className="resolve-popover-item"
						onClick={() => onSelect(c)}
					>
						<span
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: 11.5,
								color: "var(--blue-700)",
							}}
						>
							{c.courseCode}
						</span>
						<span style={{ fontSize: 12.5, color: "var(--ink)" }}>
							{c.name}
						</span>
					</button>
				))}
		</div>
	);
}
