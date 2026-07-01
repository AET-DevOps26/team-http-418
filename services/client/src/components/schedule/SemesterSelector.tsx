import { ChevronDown } from "lucide-react";

type Props = {
	value: string;
	onChange: (semester: string) => void;
};

function recentSemesters(): string[] {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const semesters: string[] = [];
	let y = year;
	let isSummer = month >= 3 && month <= 8;

	for (let i = 0; i < 4; i++) {
		semesters.push(isSummer ? `SS${y}` : `WS${y}`);
		if (isSummer) {
			isSummer = false;
		} else {
			isSummer = true;
			y--;
		}
	}
	return semesters;
}

export function SemesterSelector({ value, onChange }: Props) {
	const semesters = recentSemesters();
	return (
		<div style={{ position: "relative", display: "inline-flex" }}>
			<select
				className="btn btn-ghost"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				style={{
					appearance: "none",
					paddingRight: 28,
					cursor: "pointer",
					fontSize: 13,
				}}
			>
				{semesters.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>
			<ChevronDown
				size={14}
				style={{
					position: "absolute",
					right: 8,
					top: "50%",
					transform: "translateY(-50%)",
					pointerEvents: "none",
					color: "var(--muted)",
				}}
			/>
		</div>
	);
}
