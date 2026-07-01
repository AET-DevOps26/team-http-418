import type { ScheduleEvent } from "#/api/types";
import { EventBlock } from "./EventBlock";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 8;
const END_HOUR = 20;
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2;

type PositionedEvent = {
	event: ScheduleEvent;
	startMinutes: number;
	endMinutes: number;
	lane: number;
	laneCount: number;
};

function timeToMinutes(time: string): number {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

function minutesToRow(minutes: number): number {
	return (minutes - START_HOUR * 60) / 30 + 2;
}

function dayToColumn(day: string): number {
	return DAYS.indexOf(day as (typeof DAYS)[number]) + 2;
}

function positionEvents(events: ScheduleEvent[]): PositionedEvent[] {
	const positioned: PositionedEvent[] = [];

	for (const day of DAYS) {
		const dayEvents = events
			.filter((event) => event.day === day)
			.map((event) => ({
				event,
				startMinutes: timeToMinutes(event.startTime),
				endMinutes: timeToMinutes(event.endTime),
				lane: 0,
				laneCount: 1,
			}))
			.sort(
				(a, b) =>
					a.startMinutes - b.startMinutes ||
					a.endMinutes - b.endMinutes ||
					a.event.courseName.localeCompare(b.event.courseName),
			);

		let active: PositionedEvent[] = [];
		let cluster: PositionedEvent[] = [];
		let clusterEnd = Number.NEGATIVE_INFINITY;

		function flushCluster() {
			if (cluster.length === 0) return;
			const laneCount = Math.max(...cluster.map((item) => item.lane)) + 1;
			for (const item of cluster) item.laneCount = laneCount;
			positioned.push(...cluster);
			cluster = [];
			active = [];
		}

		for (const item of dayEvents) {
			if (cluster.length > 0 && item.startMinutes >= clusterEnd) {
				flushCluster();
				clusterEnd = Number.NEGATIVE_INFINITY;
			}

			active = active.filter(
				(activeItem) => activeItem.endMinutes > item.startMinutes,
			);
			const usedLanes = new Set(active.map((activeItem) => activeItem.lane));
			let lane = 0;
			while (usedLanes.has(lane)) lane++;
			item.lane = lane;

			active.push(item);
			cluster.push(item);
			clusterEnd = Math.max(clusterEnd, item.endMinutes);
		}

		flushCluster();
	}

	return positioned;
}

type Props = { events: ScheduleEvent[] };

export function WeekGrid({ events }: Props) {
	const timeLabels: string[] = [];
	for (let h = START_HOUR; h < END_HOUR; h++) {
		timeLabels.push(`${h.toString().padStart(2, "0")}:00`);
		timeLabels.push(`${h.toString().padStart(2, "0")}:30`);
	}
	const positionedEvents = positionEvents(events);

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
			{positionedEvents.map((item) => {
				const startRow = minutesToRow(item.startMinutes);
				const endRow = minutesToRow(item.endMinutes);
				const { event } = item;
				return (
					<EventBlock
						key={`${event.courseId}-${event.type}-${event.day}-${event.startTime}-${event.endTime}-${event.room}`}
						event={event}
						gridRow={`${startRow} / ${endRow}`}
						gridColumn={dayToColumn(event.day)}
						lane={item.lane}
						laneCount={item.laneCount}
					/>
				);
			})}
		</div>
	);
}
