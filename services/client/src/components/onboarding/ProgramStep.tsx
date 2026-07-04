import { useState } from "react";
import type { OnboardingStep1 } from "#/hooks/useOnboarding";
import { useStudyPrograms } from "#/hooks/useStudyPrograms";

const GRADUATION_OPTIONS = [
	"SS2026",
	"WS2026/27",
	"SS2027",
	"WS2027/28",
	"SS2028",
	"WS2028/29",
	"SS2029",
	"WS2029/30",
];

const inputStyle = {
	width: "100%",
	boxSizing: "border-box" as const,
	padding: "10px 12px",
	fontSize: 14,
	color: "#0B1F33",
	background: "#FFFFFF",
	border: "1px solid #E2E7EF",
	borderRadius: 10,
	outline: "none",
	fontFamily: "inherit",
};

const labelStyle = {
	display: "block" as const,
	fontSize: 13,
	fontWeight: 500 as const,
	color: "#0B1F33",
	marginBottom: 6,
};

type Props = {
	data: OnboardingStep1 | null;
	onNext: (data: OnboardingStep1) => void;
};

export function ProgramStep({ data, onNext }: Props) {
	const { data: programs, isLoading } = useStudyPrograms();
	const [studyProgramId, setStudyProgramId] = useState(
		data?.studyProgramId ?? "",
	);
	const [semester, setSemester] = useState(data?.semester ?? 1);
	const [expectedGraduation, setExpectedGraduation] = useState(
		data?.expectedGraduation ?? "WS2027/28",
	);

	const canNext = studyProgramId !== "" && semester >= 1;

	function handleNext() {
		if (!canNext) return;
		onNext({ studyProgramId, semester, expectedGraduation });
	}

	return (
		<div>
			<div style={{ marginBottom: 20 }}>
				<h2
					style={{
						margin: "0 0 4px",
						fontSize: 18,
						fontWeight: 700,
						color: "#0B1F33",
					}}
				>
					Study Program
				</h2>
				<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
					Tell us about your academic program so we can tailor recommendations.
				</p>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
				<div style={{ gridColumn: "1 / -1" }}>
					<label style={labelStyle} htmlFor="studyProgram">
						Study Program <span style={{ color: "#C03A2E" }}>*</span>
					</label>
					<select
						id="studyProgram"
						value={studyProgramId}
						onChange={(e) => setStudyProgramId(e.target.value)}
						style={{ ...inputStyle, cursor: "pointer" }}
					>
						<option value="">
							{isLoading ? "Loading programs…" : "Select your program"}
						</option>
						{programs?.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
				</div>

				<div>
					<label style={labelStyle} htmlFor="semester">
						Current Semester <span style={{ color: "#C03A2E" }}>*</span>
					</label>
					<input
						id="semester"
						type="number"
						min={1}
						max={20}
						value={semester}
						onChange={(e) => setSemester(Number(e.target.value))}
						style={inputStyle}
					/>
				</div>

				<div>
					<label style={labelStyle} htmlFor="graduation">
						Expected Graduation
					</label>
					<select
						id="graduation"
						value={expectedGraduation}
						onChange={(e) => setExpectedGraduation(e.target.value)}
						style={{ ...inputStyle, cursor: "pointer" }}
					>
						{GRADUATION_OPTIONS.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</div>
			</div>

			<div
				style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}
			>
				<button
					type="button"
					onClick={handleNext}
					disabled={!canNext}
					style={{
						padding: "9px 22px",
						fontSize: 14,
						fontWeight: 600,
						color: "#fff",
						background: canNext
							? "linear-gradient(135deg, #8A57E0, #2D6FB5)"
							: "linear-gradient(135deg, rgba(138,87,224,0.5), rgba(45,111,181,0.5))",
						border: "none",
						borderRadius: 10,
						cursor: canNext ? "pointer" : "not-allowed",
						boxShadow: canNext ? "0 4px 14px rgba(138,87,224,0.3)" : "none",
						fontFamily: "inherit",
					}}
				>
					Next →
				</button>
			</div>
		</div>
	);
}
