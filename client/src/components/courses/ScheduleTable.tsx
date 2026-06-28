import type { ScheduleSlot } from "#/api/types";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
	LECTURE: { bg: "var(--blue-50)", color: "var(--blue-700)" },
	TUTORIAL: { bg: "#f0fdf4", color: "#15803d" },
	LAB: { bg: "#fff7ed", color: "#c2410c" },
	EXAM: { bg: "#fef2f2", color: "#b91c1c" },
};

type Props = { slots: ScheduleSlot[] };

export function ScheduleTable({ slots }: Props) {
	if (!slots.length) {
		return <p style={{ fontSize: 13, color: "var(--muted)" }}>No schedule available.</p>;
	}

	const sorted = [...slots].sort(
		(a, b) =>
			DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
			a.startTime.localeCompare(b.startTime),
	);

	return (
		<table className="catalog-schedule-table">
			<thead>
				<tr>
					<th>Day</th>
					<th>Time</th>
					<th>Room</th>
					<th>Type</th>
				</tr>
			</thead>
			<tbody>
				{sorted.map((s) => {
					const colors = TYPE_COLORS[s.type] ?? { bg: "var(--canvas-2)", color: "var(--ink-soft)" };
					return (
						<tr key={`${s.day}-${s.startTime}-${s.type}`}>
							<td>{s.day}</td>
							<td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
								{s.startTime} – {s.endTime}
							</td>
							<td>{s.room}</td>
							<td>
								<span className="tag" style={{ background: colors.bg, color: colors.color }}>
									{s.type}
								</span>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
