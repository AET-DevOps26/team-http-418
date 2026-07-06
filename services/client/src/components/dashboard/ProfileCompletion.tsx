import { Link } from "@tanstack/react-router";
import { Circle, CircleCheck } from "lucide-react";

type Props = {
	hasStudyProgram: boolean;
	hasTranscript: boolean;
	hasGoalsOrInterests: boolean;
	hasCv: boolean;
	hasEnrolledCourses: boolean;
};

type ChecklistItem = {
	label: string;
	description: string;
	to: string;
	done: boolean;
};

export function ProfileCompletion({
	hasStudyProgram,
	hasTranscript,
	hasGoalsOrInterests,
	hasCv,
	hasEnrolledCourses,
}: Props) {
	const items: ChecklistItem[] = [
		{
			label: "Select study program",
			description: "Choose your degree program to track requirements.",
			to: "/profile",
			done: hasStudyProgram,
		},
		{
			label: "Upload transcript",
			description: "Import your academic history to track progress.",
			to: "/progress",
			done: hasTranscript,
		},
		{
			label: "Set goals & interests",
			description: "Personalize your recommendations.",
			to: "/profile",
			done: hasGoalsOrInterests,
		},
		{
			label: "Upload CV",
			description: "Help AIDAN understand your background.",
			to: "/profile",
			done: hasCv,
		},
		{
			label: "Enroll in courses",
			description: "Add courses to your current semester.",
			to: "/courses",
			done: hasEnrolledCourses,
		},
	];

	const completedCount = items.filter((i) => i.done).length;
	const percentage = Math.round((completedCount / 5) * 100);

	if (percentage === 100) return null;

	return (
		<div className="card" style={{ padding: "20px" }}>
			<div
				className="eyebrow"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 12,
				}}
			>
				Profile Completion
				<span
					style={{
						fontSize: 11,
						fontWeight: 700,
						color: "var(--blue-700)",
						background: "var(--blue-50)",
						borderRadius: "var(--r-sm)",
						padding: "2px 7px",
					}}
				>
					{percentage}%
				</span>
			</div>
			<div className="req-bar-track" style={{ marginBottom: 16 }}>
				<div className="req-bar-fill" style={{ width: `${percentage}%` }} />
			</div>
			<ul
				style={{
					listStyle: "none",
					margin: 0,
					padding: 0,
					display: "flex",
					flexDirection: "column",
					gap: 6,
				}}
			>
				{items.map((item) => (
					<li
						key={item.label}
						style={{
							display: "flex",
							alignItems: "flex-start",
							gap: 10,
							padding: "8px 10px",
							borderRadius: "var(--r-md)",
							background: item.done ? "transparent" : "var(--canvas)",
							opacity: item.done ? 0.5 : 1,
						}}
					>
						<div
							style={{
								color: item.done ? "var(--green-500)" : "var(--muted)",
								flexShrink: 0,
								marginTop: 2,
							}}
						>
							{item.done ? (
								<CircleCheck size={14} strokeWidth={2} />
							) : (
								<Circle size={14} strokeWidth={2} />
							)}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									fontSize: 12.5,
									fontWeight: item.done ? 500 : 600,
									color: item.done ? "var(--muted)" : "var(--ink)",
									marginBottom: 1,
								}}
							>
								{item.label}
							</div>
							{!item.done && (
								<div
									style={{
										fontSize: 11.5,
										color: "var(--muted)",
										lineHeight: 1.4,
									}}
								>
									{item.description}
								</div>
							)}
						</div>
						{!item.done && (
							<Link
								to={item.to}
								className="btn btn-ghost"
								style={{ fontSize: 11, padding: "3px 8px", flexShrink: 0 }}
							>
								Go
							</Link>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
