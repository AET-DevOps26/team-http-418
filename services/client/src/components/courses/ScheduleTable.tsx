import type { ScheduleSlot } from "#/api/types";

const DAY_ORDER = ["Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So."];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
	LECTURE: { bg: "var(--blue-50)", color: "var(--blue-700)" },
	TUTORIAL: { bg: "#f0fdf4", color: "#15803d" },
	LAB: { bg: "#fff7ed", color: "#c2410c" },
	EXAM: { bg: "#fef2f2", color: "#b91c1c" },
};

type Props = { slots: ScheduleSlot[] };

export function ScheduleTable({ slots }: Props) {
	if (!slots.length) {
		return (
			<p style={{ fontSize: 13, color: "var(--muted)" }}>
				No schedule available.
			</p>
		);
	}

	function dayRank(day: string) {
		const rank = DAY_ORDER.indexOf(day.toUpperCase());
		return rank === -1 ? DAY_ORDER.length : rank;
	}

	const sorted = [...slots].sort(
		(a, b) =>
			dayRank(a.weekday_key) - dayRank(b.weekday_key) ||
			a.time_from < b.time_from,
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
					const colors = /*TYPE_COLORS[s.type] ?? */ {
						bg: "var(--canvas-2)",
						color: "var(--ink-soft)",
					};
					return (
						<tr key={`${s.weekday_key}-${s.time_from}`}>
							<td>{s.weekday_key}</td>
							<td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
								{s.time_from} – {s.time_to}
							</td>
							<td>{s.place}</td>
							<td>
								<span
									className="tag"
									style={{ background: colors.bg, color: colors.color }}
								>
									{s.is_series ? "series" : "one time"}
								</span>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
