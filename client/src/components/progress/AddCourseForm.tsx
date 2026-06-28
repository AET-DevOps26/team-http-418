import { type FormEvent, useState } from "react";
import { useToast } from "#/components/ui/Toast";
import { useAddCompletedCourse } from "#/hooks/useProgress";

export function AddCourseForm() {
	const [courseId, setCourseId] = useState("");
	const [grade, setGrade] = useState("");
	const [semester, setSemester] = useState("");
	const mutation = useAddCompletedCourse();
	const { toast } = useToast();

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!courseId || !grade || !semester) return;
		mutation.mutate(
			{ courseId, grade: Number.parseFloat(grade), semester },
			{
				onSuccess: () => {
					toast("Course added successfully", "success");
					setCourseId("");
					setGrade("");
					setSemester("");
				},
				onError: () => {
					toast("Failed to add course", "error");
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
				gap: 8,
				alignItems: "center",
				padding: "12px 0",
			}}
		>
			<input
				style={{ ...inputStyle, flex: 1 }}
				placeholder="Course ID"
				value={courseId}
				onChange={(e) => setCourseId(e.target.value)}
			/>
			<input
				style={{ ...inputStyle, width: 80 }}
				placeholder="Grade"
				value={grade}
				onChange={(e) => setGrade(e.target.value)}
				type="number"
				step="0.1"
				min="1.0"
				max="5.0"
			/>
			<input
				style={{ ...inputStyle, width: 100 }}
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
				{mutation.isPending ? "Adding…" : "Add Course"}
			</button>
		</form>
	);
}
