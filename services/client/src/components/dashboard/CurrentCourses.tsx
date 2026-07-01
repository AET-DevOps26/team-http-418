import { Calendar } from "lucide-react";
import type { UpcomingCourse } from "#/api/types";

function formatDay(day: string): string {
	return day.charAt(0) + day.slice(1).toLowerCase();
}

type Props = {
	courses: UpcomingCourse[];
	semester: string;
};

export function CurrentCourses({ courses, semester }: Props) {
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
					Current Courses · {semester}
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
				<p style={{ fontSize: 13, color: "var(--muted)" }}>
					No courses enrolled.
				</p>
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
										{course.courseCode}
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
									{formatDay(course.nextSession.day)}{" "}
									{course.nextSession.startTime}
								</span>
								<span>·</span>
								<span>{course.nextSession.room}</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
