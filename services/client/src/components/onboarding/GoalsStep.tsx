import { useState } from "react";
import { GoalsInterestsEditor } from "#/components/profile/GoalsInterestsEditor";
import { WorkloadPicker } from "#/components/profile/WorkloadPicker";
import type { OnboardingStep3 } from "#/hooks/useOnboarding";

const INDUSTRY_OPTIONS = [
	"Software/Tech",
	"Finance/Banking",
	"Research/Academia",
	"Consulting",
	"Healthcare",
	"Government",
	"Other",
];

const ROLE_OPTIONS = [
	"Software Engineer",
	"Data Scientist",
	"Product Manager",
	"Research Scientist",
	"Consultant",
	"Machine Learning Engineer",
	"Other",
];

const selectStyle = {
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
	cursor: "pointer",
};

const labelStyle = {
	display: "block" as const,
	fontSize: 13,
	fontWeight: 600 as const,
	color: "#0B1F33",
	marginBottom: 8,
};

type Props = {
	data: OnboardingStep3 | null;
	onComplete: (data: OnboardingStep3) => void;
	onSkip: () => void;
	isLoading?: boolean;
};

export function GoalsStep({ data, onComplete, onSkip, isLoading }: Props) {
	const [industryPreference, setIndustryPreference] = useState(
		data?.industryPreference ?? "",
	);
	const [rolePreference, setRolePreference] = useState(data?.rolePreference ?? "");
	const [careerGoals, setCareerGoals] = useState<string[]>(data?.careerGoals ?? []);
	const [interests, setInterests] = useState<string[]>(data?.interests ?? []);
	const [preferredWorkload, setPreferredWorkload] = useState(
		data?.preferredWorkload ?? 20,
	);

	function handleComplete() {
		onComplete({
			industryPreference,
			rolePreference,
			careerGoals,
			interests,
			preferredWorkload,
		});
	}

	return (
		<div>
			<div style={{ marginBottom: 20 }}>
				<h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0B1F33" }}>
					Goals & Preferences
				</h2>
				<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
					Help the AI advisor understand your career direction. All fields are optional.
				</p>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
					<div>
						<label style={labelStyle} htmlFor="industry">
							Industry Preference
						</label>
						<select
							id="industry"
							value={industryPreference}
							onChange={(e) => setIndustryPreference(e.target.value)}
							style={selectStyle}
						>
							<option value="">Not specified</option>
							{INDUSTRY_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>

					<div>
						<label style={labelStyle} htmlFor="role">
							Role Preference
						</label>
						<select
							id="role"
							value={rolePreference}
							onChange={(e) => setRolePreference(e.target.value)}
							style={selectStyle}
						>
							<option value="">Not specified</option>
							{ROLE_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
					</div>
				</div>

				<GoalsInterestsEditor
					label="Career Goals"
					items={careerGoals}
					editing={true}
					onChange={setCareerGoals}
				/>

				<GoalsInterestsEditor
					label="Interests"
					items={interests}
					editing={true}
					onChange={setInterests}
				/>

				<WorkloadPicker
					value={preferredWorkload}
					editing={true}
					onChange={setPreferredWorkload}
				/>
			</div>

			<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
				<button
					type="button"
					onClick={onSkip}
					disabled={isLoading}
					style={{
						padding: "9px 18px",
						fontSize: 14,
						fontWeight: 500,
						color: "#6E7E94",
						background: "none",
						border: "1px solid #E2E7EF",
						borderRadius: 10,
						cursor: isLoading ? "not-allowed" : "pointer",
						fontFamily: "inherit",
					}}
				>
					Skip & Finish
				</button>
				<button
					type="button"
					onClick={handleComplete}
					disabled={isLoading}
					style={{
						padding: "9px 22px",
						fontSize: 14,
						fontWeight: 600,
						color: "#fff",
						background: isLoading
							? "linear-gradient(135deg, rgba(138,87,224,0.5), rgba(45,111,181,0.5))"
							: "linear-gradient(135deg, #8A57E0, #2D6FB5)",
						border: "none",
						borderRadius: 10,
						cursor: isLoading ? "not-allowed" : "pointer",
						boxShadow: isLoading ? "none" : "0 4px 14px rgba(138,87,224,0.3)",
						fontFamily: "inherit",
					}}
				>
					{isLoading ? "Finishing…" : "Complete Setup"}
				</button>
			</div>
		</div>
	);
}
