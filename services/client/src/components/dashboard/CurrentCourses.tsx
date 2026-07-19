import { Link } from "@tanstack/react-router";
import type { EnrolledCourse } from "#/api/types";
import { InfoBanner } from "#/components/dashboard/InfoBanner";

type CourseDisplay = {
	courseId: string;
	courseCode: string;
	courseName: string;
};

function getCoursesFromEnrolled(courses: EnrolledCourse[]): CourseDisplay[] {
	return courses.map((c) => ({
		courseId: c.courseId,
		courseCode: c.courseCode,
		courseName: c.courseName,
	}));
}

type Props = {
	enrolledCourses?: EnrolledCourse[];
	semester?: string;
};

export function CurrentCourses({ enrolledCourses, semester }: Props) {
	const courses: CourseDisplay[] = enrolledCourses?.length
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
			</div>

			{courses.length === 0 ? (
				<InfoBanner
					title="Enroll in courses to see your semester"
					description="Browse available courses and enroll to track your current semester here."
					action={
						<Link
							to="/courses"
							className="btn btn-primary"
							style={{
								fontSize: 12,
								padding: "5px 12px",
								display: "inline-flex",
							}}
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
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
