import type { MessageRole, ReferencedCourse } from "#/api/types";

type Props = {
	sender: MessageRole;
	content: string;
	referencedCourses?: ReferencedCourse[];
};

export function MessageBubble({ sender, content, referencedCourses }: Props) {
	const isUser = sender === "USER";

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: isUser ? "flex-end" : "flex-start",
			}}
		>
			<div className={isUser ? "msg-user" : "msg-assistant"}>{content}</div>
			{referencedCourses && referencedCourses.length > 0 && (
				<div
					style={{
						display: "flex",
						gap: 6,
						flexWrap: "wrap",
						marginTop: 6,
						alignSelf: isUser ? "flex-end" : "flex-start",
					}}
				>
					{referencedCourses.map((c) => (
						<a
							key={c.courseId}
							href={`/courses/${c.courseId}`}
							className="course-chip"
						>
							{c?.courseCode ?? "N/A"}
						</a>
					))}
				</div>
			)}
		</div>
	);
}
