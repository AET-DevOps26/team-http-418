import { Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import type { CourseSummary, ScheduleEvent } from "#/api/types";
import { InfoBanner } from "#/components/dashboard/InfoBanner";

function formatDay(day: string): string {
	return day.charAt(0) + day.slice(1).toLowerCase();
}

type CourseDisplay = {
	courseId: string;
	courseCode: string;
	courseName: string;
	session?: { day: string; startTime: string; room: string };
};

function getCoursesFromEvents(events: ScheduleEvent[]): CourseDisplay[] {
	const seen = new Set<string>();
	const result: CourseDisplay[] = [];
	for (const event of events) {
		if (!seen.has(event.courseId)) {
			seen.add(event.courseId);
			result.push({
				courseId: event.courseId,
				courseCode: event.courseCode,
				courseName: event.courseName,
				session: {
					day: event.day,
					startTime: event.startTime,
					room: event.room,
				},
			});
		}
	}
	return result;
}

function getCoursesFromEnrolled(courses: CourseSummary[]): CourseDisplay[] {
	return courses.map((c) => ({
		courseId: c.id,
		courseCode: c.courseCode,
		courseName: c.name,
	}));
}

type Props = {
	events?: ScheduleEvent[];
	enrolledCourses?: CourseSummary[];
	semester?: string;
	hasScheduleData: boolean;
};

export function CurrentCourses({
	events,
	enrolledCourses,
	semester,
	hasScheduleData,
}: Props) {
	const courses: CourseDisplay[] =
		hasScheduleData && events?.length
			? getCoursesFromEvents(events)
			: enrolledCourses?.length
				? getCoursesFromEnrolled(enrolledCourses)
				: [];

	return (
		<div className="card" style={{ padding: "20px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 14,
				}}
			>
				<div className="eyebrow" style={{ marginBottom: 0 }}>
					Current Courses{semester ? ` · ${semester}` : ""}
				</div>
				<button
					type="button"
					className="btn btn-ghost"
					style={{ padding: "4px 10px", fontSize: 11, gap: 4 }}
				>
					<Calendar size={11} strokeWidth={2} />
					Schedule
				</button>
			</div>

			{courses.length === 0 ? (
				<InfoBanner
					title="Enroll in courses to see your semester"
					description="Browse available courses and enroll to track your semester schedule here."
					action={
						<Link
							to="/courses"
							className="btn btn-primary"
							style={{ fontSize: 12, padding: "5px 12px", display: "inline-flex" }}
						>
							Browse courses
						</Link>
					}
				/>
			) : (
				<ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
					{courses.map((course, i) => (
						<li
							key={course.courseId}
							style={{
								paddingTop: i === 0 ? 0 : 12,
								paddingBottom: 12,
								borderBottom:
									i < courses.length - 1
										? "1px solid var(--line-soft)"
										: "none",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "flex-start",
									justifyContent: "space-between",
									gap: 12,
								}}
							>
								<div>
									<span
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: 11,
											fontWeight: 500,
											color: "var(--blue-700)",
											background: "var(--blue-50)",
											padding: "1px 5px",
											borderRadius: "var(--r-xs)",
											marginRight: 6,
										}}
									>
										{course.courseCode ?? "N/A"}
									</span>
									<span
										style={{
											fontSize: 13,
											fontWeight: 500,
											color: "var(--ink)",
										}}
									>
										{course.courseName}
									</span>
								</div>
							</div>
							{course.session && (
								<div
									style={{
										marginTop: 4,
										fontSize: 11.5,
										color: "var(--muted)",
										display: "flex",
										gap: 8,
									}}
								>
									<span>
										{formatDay(course.session.day)} {course.session.startTime}
									</span>
									<span>·</span>
									<span>{course.session.room}</span>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
