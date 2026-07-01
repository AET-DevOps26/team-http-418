import { Minus, Plus } from "lucide-react";

export function WorkloadPicker({
	value,
	editing,
	onChange,
}: {
	value: number;
	editing: boolean;
	onChange: (v: number) => void;
}) {
	return (
		<div className="card" style={{ padding: 24 }}>
			<p className="eyebrow">Preferred Workload</p>
			{editing ? (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 12,
					}}
				>
					<button
						type="button"
						className="btn btn-ghost"
						style={{ padding: "6px 8px" }}
						disabled={value <= 0}
						onClick={() => onChange(Math.max(0, value - 1))}
					>
						<Minus size={16} />
					</button>
					<span
						style={{
							fontSize: 28,
							fontWeight: 700,
							color: "var(--ink)",
							minWidth: 48,
							textAlign: "center",
						}}
					>
						{value}
					</span>
					<button
						type="button"
						className="btn btn-ghost"
						style={{ padding: "6px 8px" }}
						disabled={value >= 60}
						onClick={() => onChange(Math.min(60, value + 1))}
					>
						<Plus size={16} />
					</button>
					<span style={{ fontSize: 13, color: "var(--muted)" }}>
						ECTS / semester
					</span>
				</div>
			) : (
				<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
					<span style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>
						{value}
					</span>
					<span style={{ fontSize: 13, color: "var(--muted)" }}>
						ECTS / semester
					</span>
				</div>
			)}
		</div>
	);
}
