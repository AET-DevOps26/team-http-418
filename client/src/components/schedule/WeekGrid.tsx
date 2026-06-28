import type { ScheduleEvent } from "#/api/types";
import { EventBlock } from "./EventBlock";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2;

function timeToRow(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return ((h - START_HOUR) * 60 + m) / 30 + 2;
}

function dayToColumn(day: string): number {
	return DAYS.indexOf(day as (typeof DAYS)[number]) + 2;
}

type Props = { events: ScheduleEvent[] };

export function WeekGrid({ events }: Props) {
	const timeLabels: string[] = [];
	for (let h = START_HOUR; h < END_HOUR; h++) {
		timeLabels.push(`${h.toString().padStart(2, "0")}:00`);
		timeLabels.push(`${h.toString().padStart(2, "0")}:30`);
	}

	return (
		<div className="schedule-grid">
			{/* Corner cell */}
			<div
				style={{
					gridRow: 1,
					gridColumn: 1,
					borderBottom: "1px solid var(--line)",
					borderRight: "1px solid var(--line)",
					background: "var(--paper)",
				}}
			/>

			{/* Day headers */}
			{DAY_LABELS.map((label, i) => (
				<div
					key={label}
					className="schedule-day-header"
					style={{ gridRow: 1, gridColumn: i + 2 }}
				>
					{label}
				</div>
			))}

			{/* Time labels */}
			{timeLabels.map((label, i) => (
				<div
					key={label}
					className="schedule-time-label"
					style={{ gridRow: i + 2, gridColumn: 1 }}
				>
					{i % 2 === 0 ? label : ""}
				</div>
			))}

			{/* Background cells */}
			{Array.from({ length: SLOT_COUNT }, (_, row) =>
				DAYS.map((day) => (
					<div
						key={`${timeLabels[row]}-${day}`}
						className="schedule-cell"
						style={{ gridRow: row + 2, gridColumn: dayToColumn(day) }}
					/>
				)),
			)}

			{/* Events */}
			{events.map((event) => {
				const startRow = timeToRow(event.startTime);
				const endRow = timeToRow(event.endTime);
				return (
					<EventBlock
						key={`${event.courseCode}-${event.type}-${event.day}`}
						event={event}
						gridRow={`${startRow} / ${endRow}`}
						gridColumn={dayToColumn(event.day)}
					/>
				);
			})}
		</div>
	);
}
