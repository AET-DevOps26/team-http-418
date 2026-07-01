import { type FormEvent, useState } from "react";
import { useToast } from "#/components/ui/Toast";
import { useEnrollCourse } from "#/hooks/useProgress";

export function EnrollCourseForm() {
	const [courseId, setCourseId] = useState("");
	const [semester, setSemester] = useState("");
	const mutation = useEnrollCourse();
	const { toast } = useToast();

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const trimmedCourseId = courseId.trim();
		const trimmedSemester = semester.trim();
		if (!trimmedCourseId || !trimmedSemester) return;

		mutation.mutate(
			{ courseId: trimmedCourseId, semester: trimmedSemester },
			{
				onSuccess: () => {
					toast("Course enrolled successfully", "success");
					setCourseId("");
					setSemester("");
				},
				onError: () => {
					toast("Failed to enroll course", "error");
				},
			},
		);
	}

	const inputStyle: React.CSSProperties = {
		padding: "7px 12px",
		fontSize: 13,
		border: "1px solid var(--line)",
		borderRadius: "var(--r-md)",
		fontFamily: "var(--font-sans)",
		background: "var(--paper)",
		color: "var(--ink)",
		outline: "none",
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: 8,
				alignItems: "center",
				padding: "12px 0",
			}}
		>
			<input
				style={{ ...inputStyle, flex: "1 1 180px" }}
				placeholder="Course ID"
				value={courseId}
				onChange={(e) => setCourseId(e.target.value)}
			/>
			<input
				style={{ ...inputStyle, width: 120 }}
				placeholder="e.g. WS2025"
				value={semester}
				onChange={(e) => setSemester(e.target.value)}
			/>
			<button
				type="submit"
				className="btn btn-primary"
				style={{ fontSize: 13 }}
				disabled={mutation.isPending}
			>
				{mutation.isPending ? "Enrolling..." : "Enroll Course"}
			</button>
		</form>
	);
}
