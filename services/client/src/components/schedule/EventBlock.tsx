import { Clock, MapPin } from "lucide-react";
import type { ScheduleEvent } from "#/api/types";

type Props = {
	event: ScheduleEvent;
	gridRow: string;
	gridColumn: number;
	lane?: number;
	laneCount?: number;
};

const typeBadge: Record<string, string> = {
	LECTURE: "LEC",
	TUTORIAL: "TUT",
	LAB: "LAB",
	EXAM: "EXAM",
};

export function EventBlock({
	event,
	gridRow,
	gridColumn,
	lane = 0,
	laneCount = 1,
}: Props) {
	const isStacked = laneCount > 1;

	return (
		<a
			href={`/courses/${event.courseId}`}
			className="schedule-event"
			style={{
				gridRow,
				gridColumn,
				width: isStacked ? `calc(${100 / laneCount}% - 2px)` : undefined,
				margin: isStacked ? "1px 1px" : "1px 2px",
				marginLeft: isStacked
					? `calc(${(lane * 100) / laneCount}% + 1px)`
					: undefined,
				background: `${event.color}14`,
				borderLeft: `3px solid ${event.color}`,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: 11,
						fontWeight: 600,
						color: event.color,
					}}
				>
					{event.courseCode}
				</span>
				<span
					style={{
						fontSize: 9,
						fontWeight: 600,
						letterSpacing: "0.04em",
						background: `${event.color}22`,
						color: event.color,
						padding: "1px 4px",
						borderRadius: "var(--r-xs)",
					}}
				>
					{typeBadge[event.type] ?? event.type}
				</span>
			</div>
			<span
				style={{
					fontSize: 11,
					color: "var(--ink-soft)",
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{event.courseName}
			</span>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginTop: 2,
					fontSize: 10,
					color: "var(--muted)",
				}}
			>
				<span style={{ display: "flex", alignItems: "center", gap: 2 }}>
					<MapPin size={9} />
					{event.room}
				</span>
				<span style={{ display: "flex", alignItems: "center", gap: 2 }}>
					<Clock size={9} />
					{event.startTime}–{event.endTime}
				</span>
			</div>
		</a>
	);
}
