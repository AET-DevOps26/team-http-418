import type { UpcomingCourse } from "#/api/types";

function formatDay(day: string): string {
	return day.charAt(0) + day.slice(1).toLowerCase();
}

type Props = { courses: UpcomingCourse[] };

export function UpcomingClasses({ courses }: Props) {
	return (
		<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">
				Upcoming Classes
			</h2>
			{courses.length === 0 ? (
				<p className="text-sm text-gray-500">No upcoming classes.</p>
			) : (
				<ul className="space-y-3">
					{courses.map((course) => (
						<li
							key={course.courseId}
							className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
						>
							<div>
								<span className="text-sm font-medium text-gray-900">
									{course.courseCode}
								</span>
								<span className="mx-1.5 text-gray-300">·</span>
								<span className="text-sm text-gray-600">
									{course.courseName}
								</span>
							</div>
							<div className="text-right text-xs text-gray-500 shrink-0 ml-4">
								<span>
									{formatDay(course.nextSession.day)}{" "}
									{course.nextSession.startTime}
								</span>
								<span className="mx-1">—</span>
								<span>{course.nextSession.room}</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
