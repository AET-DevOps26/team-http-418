import { Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
	value: string;
	ai: boolean;
	onChange: (value: string) => void;
	onAiToggle: (ai: boolean) => void;
};

export function SearchBar({ value, ai, onChange, onAiToggle }: Props) {
	const [local, setLocal] = useState(value);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setLocal(value);
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, [value]);

	useEffect(() => {
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const v = e.target.value;
		setLocal(v);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => onChange(v), 300);
	}

	return (
		<div className="catalog-search-bar">
			<div className="catalog-search-input-wrap">
				<Search size={15} strokeWidth={1.75} className="catalog-search-icon" />
				<input
					className="catalog-search-input"
					type="text"
					placeholder="Search courses…"
					value={local}
					onChange={handleChange}
				/>
			</div>
			<button
				type="button"
				className={`catalog-ai-toggle${ai ? " catalog-ai-toggle--on" : ""}`}
				onClick={() => onAiToggle(!ai)}
				title="AI semantic search"
			>
				<Sparkles size={13} strokeWidth={1.75} />
				<span>AI search</span>
				<span className="catalog-ai-switch">
					<span className="catalog-ai-switch-knob" />
				</span>
			</button>
		</div>
	);
}
