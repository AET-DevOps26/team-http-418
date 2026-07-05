import { BookOpen } from "lucide-react";
import type { StudentProfile } from "#/api/types";

export function ProfileHeader({ profile }: { profile: StudentProfile }) {
	const fullName = [profile.student.firstName, profile.student.lastName]
		.filter(Boolean)
		.join(" ");
	const initials = [profile.student.firstName, profile.student.lastName]
		.filter(Boolean)
		.map((n) => n?.[0]?.toUpperCase())
		.join("");

	return (
		<div className="card" style={{ padding: 24 }}>
			<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
				<div
					style={{
						width: 56,
						height: 56,
						borderRadius: "50%",
						background:
							"linear-gradient(135deg, var(--blue-600), var(--blue-800))",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#fff",
						fontSize: 22,
						fontWeight: 700,
						flexShrink: 0,
					}}
				>
					{initials || "?"}
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<h2
						style={{
							margin: 0,
							fontSize: 20,
							fontWeight: 700,
							color: "var(--ink)",
						}}
					>
						{fullName || "Student"}
					</h2>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "6px 16px",
							marginTop: 6,
							fontSize: 13,
							color: "var(--muted)",
						}}
					>
						<span
							style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
						>
							<BookOpen size={14} />
							Semester {profile.student.semester}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
