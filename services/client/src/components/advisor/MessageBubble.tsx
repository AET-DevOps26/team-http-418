import { Link } from "@tanstack/react-router";
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
				width: "100%",
			}}
		>
			<div
				className={isUser ? "msg-user" : "msg-assistant"}
				style={{ whiteSpace: "pre-wrap" }}
			>
				{content}
			</div>
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
						<Link
							key={c.courseId}
							to="/courses"
							search={{ course: c.courseId }}
							className="course-chip"
						>
							{c?.courseCode ?? "N/A"}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
