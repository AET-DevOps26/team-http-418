import { createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GoalsInterestsEditor } from "#/components/profile/GoalsInterestsEditor";
import { ProfileHeader } from "#/components/profile/ProfileHeader";
import { StudyProgramList } from "#/components/profile/StudyProgramList";
import { WorkloadPicker } from "#/components/profile/WorkloadPicker";
import { useProfile } from "#/hooks/useProfile";
import { useStudyPrograms } from "#/hooks/useStudyPrograms";
import { useUpdateProfile } from "#/hooks/useUpdateProfile";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

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

const inputStyle = {
	width: "100%",
	boxSizing: "border-box" as const,
	padding: "10px 12px",
	fontSize: 14,
	color: "var(--ink)",
	background: "#fff",
	border: "1px solid var(--line)",
	borderRadius: "var(--r-md)",
	outline: "none",
	fontFamily: "inherit",
};

function ProfileSkeleton() {
	return (
		<div style={{ padding: "28px 28px 40px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
				}}
			>
				<div>
					<div
						className="skel"
						style={{ height: 28, width: 200, marginBottom: 8 }}
					/>
					<div className="skel" style={{ height: 14, width: 140 }} />
				</div>
				<div className="skel" style={{ height: 36, width: 80 }} />
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 20,
				}}
			>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="card" style={{ padding: 24 }}>
						<div
							className="skel"
							style={{ height: 14, width: 120, marginBottom: 16 }}
						/>
						<div className="skel" style={{ height: 36, width: "100%" }} />
					</div>
				))}
			</div>
		</div>
	);
}

type Draft = {
	firstName: string;
	lastName: string;
	studyProgramId: string;
	studyProgramName: string;
	semester: number;
	expectedGraduation: string;
	industryPreference: string;
	rolePreference: string;
	preferredWorkload: number;
	careerGoals: string[];
	interests: string[];
};

function ProfilePage() {
	const { data: profile, isLoading, isError, refetch } = useProfile();
	const { data: studyPrograms } = useStudyPrograms();
	const mutation = useUpdateProfile();
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState<Draft | null>(null);

	if (isLoading) return <ProfileSkeleton />;

	if (isError || !profile) {
		return (
			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p style={{ color: "var(--muted)", marginBottom: 12, fontSize: 14 }}>
						Failed to load profile.
					</p>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => refetch()}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	function enterEdit() {
		if (!profile) return;
		setDraft({
			firstName: profile.student.firstName ?? "",
			lastName: profile.student.lastName ?? "",
			studyProgramId: profile.student.studyProgramId ?? "",
			studyProgramName: profile.student.studyProgramName ?? "",
			semester: profile.student.semester,
			expectedGraduation: profile.student.expectedGraduation ?? "WS2027/28",
			industryPreference: profile.student.industryPreference ?? "",
			rolePreference: profile.student.rolePreference ?? "",
			preferredWorkload: profile.student.preferredWorkload,
			careerGoals: [...profile.student.careerGoals],
			interests: [...profile.student.interests],
		});
		setEditing(true);
	}

	function cancelEdit() {
		setDraft(null);
		setEditing(false);
	}

	function computeDirtyFields(): Partial<Draft> | null {
		if (!draft || !profile) return null;
		const dirty: Partial<Draft> = {};
		if (draft.firstName !== (profile.student.firstName ?? ""))
			dirty.firstName = draft.firstName;
		if (draft.lastName !== (profile.student.lastName ?? ""))
			dirty.lastName = draft.lastName;
		if (draft.studyProgramId !== (profile.student.studyProgramId ?? "")) {
			dirty.studyProgramId = draft.studyProgramId;
			dirty.studyProgramName = studyPrograms?.find(
				(sp) => sp.id === draft.studyProgramId,
			)?.name ?? "";
		}

		if (draft.semester !== profile.student.semester)
			dirty.semester = draft.semester;
		if (draft.expectedGraduation !== (profile.student.expectedGraduation ?? ""))
			dirty.expectedGraduation = draft.expectedGraduation;
		if (draft.industryPreference !== (profile.student.industryPreference ?? ""))
			dirty.industryPreference = draft.industryPreference;
		if (draft.rolePreference !== (profile.student.rolePreference ?? ""))
			dirty.rolePreference = draft.rolePreference;
		if (draft.preferredWorkload !== profile.student.preferredWorkload)
			dirty.preferredWorkload = draft.preferredWorkload;
		if (
			JSON.stringify(draft.careerGoals) !==
			JSON.stringify(profile.student.careerGoals)
		)
			dirty.careerGoals = draft.careerGoals;
		if (
			JSON.stringify(draft.interests) !==
			JSON.stringify(profile.student.interests)
		)
			dirty.interests = draft.interests;
		return Object.keys(dirty).length > 0 ? dirty : null;
	}

	function handleSave() {
		const dirtyFields = computeDirtyFields();
		if (!dirtyFields) {
			setEditing(false);
			setDraft(null);
			return;
		}
		mutation.mutate(dirtyFields, {
			onSuccess: () => {
				toast.success("Profile updated");
				setEditing(false);
				setDraft(null);
			},
			onError: (e) => {
				console.error("Failed to update profile", e);
				toast.error("Failed to update profile");
			},
		});
	}

	const s = profile.student;
	const d = draft;
	const resolvedProgram = studyPrograms?.find(
		(sp) => sp.id === (editing && d ? d.studyProgramId : s.studyProgramId),
	);

	return (
		<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
				}}
			>
				<h1
					style={{
						margin: 0,
						fontSize: 24,
						fontWeight: 700,
						color: "var(--ink)",
					}}
				>
					Profile & Goals
				</h1>
				<div style={{ display: "flex", gap: 8 }}>
					{editing ? (
						<>
							<button
								type="button"
								className="btn btn-ghost"
								onClick={cancelEdit}
								disabled={mutation.isPending}
							>
								Cancel
							</button>
							<button
								type="button"
								className="btn btn-primary"
								onClick={handleSave}
								disabled={mutation.isPending}
							>
								{mutation.isPending ? "Saving…" : "Save"}
							</button>
						</>
					) : (
						<button type="button" className="btn btn-ghost" onClick={enterEdit}>
							<Pencil size={14} />
							Edit
						</button>
					)}
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 20,
				}}
			>
				{/* Left column */}
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<ProfileHeader profile={profile} />

					{editing && d ? (
						<div className="card" style={{ padding: 24 }}>
							<p className="eyebrow">Name</p>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr",
									gap: 12,
								}}
							>
								<div>
									<label
										htmlFor="profile-first-name"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										First Name
									</label>
									<input
										id="profile-first-name"
										type="text"
										value={d.firstName}
										onChange={(e) =>
											setDraft((prev) =>
												prev ? { ...prev, firstName: e.target.value } : prev,
											)
										}
										style={inputStyle}
									/>
								</div>
								<div>
									<label
										htmlFor="profile-last-name"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										Last Name
									</label>
									<input
										id="profile-last-name"
										type="text"
										value={d.lastName}
										onChange={(e) =>
											setDraft((prev) =>
												prev ? { ...prev, lastName: e.target.value } : prev,
											)
										}
										style={inputStyle}
									/>
								</div>
							</div>
						</div>
					) : null}

					{editing && d ? (
						<div className="card" style={{ padding: 24 }}>
							<p className="eyebrow">Study Program</p>
							<select
								value={d.studyProgramId}
								onChange={(e) =>
									setDraft((prev) =>
										prev ? { ...prev, studyProgramId: e.target.value } : prev,
									)
								}
								style={{ ...inputStyle, cursor: "pointer" }}
							>
								<option value="">Select program</option>
								{studyPrograms?.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>
					) : (
						<StudyProgramList
							programs={resolvedProgram ? [resolvedProgram] : []}
						/>
					)}

					{s.cvData && (
						<div className="card" style={{ padding: 24 }}>
							<p className="eyebrow">CV Data</p>
							{s.cvData.skills?.length > 0 && (
								<div style={{ marginBottom: 12 }}>
									<div
										style={{
											fontSize: 12,
											fontWeight: 600,
											color: "var(--muted)",
											marginBottom: 6,
										}}
									>
										Skills
									</div>
									<div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
										{s.cvData.skills.map((skill) => (
											<span
												key={skill}
												className="tag"
												style={{
													background: "var(--line-soft)",
													color: "var(--ink-soft)",
												}}
											>
												{skill}
											</span>
										))}
									</div>
								</div>
							)}
							{s.cvData.languages?.length > 0 && (
								<div style={{ marginBottom: 12 }}>
									<div
										style={{
											fontSize: 12,
											fontWeight: 600,
											color: "var(--muted)",
											marginBottom: 6,
										}}
									>
										Languages
									</div>
									<div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
										{s.cvData.languages.map((lang) => (
											<span
												key={lang}
												className="tag"
												style={{
													background: "var(--line-soft)",
													color: "var(--ink-soft)",
												}}
											>
												{lang}
											</span>
										))}
									</div>
								</div>
							)}
							{s.cvData.workExperience?.length > 0 && (
								<div>
									<div
										style={{
											fontSize: 12,
											fontWeight: 600,
											color: "var(--muted)",
											marginBottom: 6,
										}}
									>
										Work Experience
									</div>
									{s.cvData.workExperience.map((exp) => (
										<div
											key={`${exp.company}-${exp.role}`}
											style={{
												fontSize: 13,
												color: "var(--ink-soft)",
												marginBottom: 4,
											}}
										>
											<span style={{ fontWeight: 600 }}>{exp.role}</span> at{" "}
											{exp.company}
											{exp.duration && (
												<span style={{ color: "var(--muted)" }}>
													{" "}
													· {exp.duration}
												</span>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Right column */}
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<div className="card" style={{ padding: 24 }}>
						<p className="eyebrow">Semester & Graduation</p>
						{editing && d ? (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr",
									gap: 12,
								}}
							>
								<div>
									<label
										htmlFor="profile-current-semester"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										Current Semester
									</label>
									<input
										id="profile-current-semester"
										type="number"
										min={1}
										max={20}
										value={d.semester}
										onChange={(e) =>
											setDraft((prev) =>
												prev
													? { ...prev, semester: Number(e.target.value) }
													: prev,
											)
										}
										style={inputStyle}
									/>
								</div>
								<div>
									<label
										htmlFor="profile-expected-graduation"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										Expected Graduation
									</label>
									<select
										id="profile-expected-graduation"
										value={d.expectedGraduation}
										onChange={(e) =>
											setDraft((prev) =>
												prev
													? { ...prev, expectedGraduation: e.target.value }
													: prev,
											)
										}
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
						) : (
							<div style={{ display: "flex", gap: 24 }}>
								<div>
									<div
										style={{
											fontSize: 12,
											color: "var(--muted)",
											marginBottom: 2,
										}}
									>
										Semester
									</div>
									<div
										style={{
											fontSize: 16,
											fontWeight: 600,
											color: "var(--ink)",
										}}
									>
										{s.semester}
									</div>
								</div>
								{s.expectedGraduation && (
									<div>
										<div
											style={{
												fontSize: 12,
												color: "var(--muted)",
												marginBottom: 2,
											}}
										>
											Expected Graduation
										</div>
										<div
											style={{
												fontSize: 16,
												fontWeight: 600,
												color: "var(--ink)",
											}}
										>
											{s.expectedGraduation}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="card" style={{ padding: 24 }}>
						<p className="eyebrow">Preferences</p>
						{editing && d ? (
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "1fr 1fr",
									gap: 12,
								}}
							>
								<div>
									<label
										htmlFor="profile-industry"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										Industry
									</label>
									<select
										id="profile-industry"
										value={d.industryPreference}
										onChange={(e) =>
											setDraft((prev) =>
												prev
													? { ...prev, industryPreference: e.target.value }
													: prev,
											)
										}
										style={{ ...inputStyle, cursor: "pointer" }}
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
									<label
										htmlFor="profile-role"
										style={{
											display: "block",
											fontSize: 12,
											fontWeight: 500,
											color: "var(--muted)",
											marginBottom: 4,
										}}
									>
										Role
									</label>
									<select
										id="profile-role"
										value={d.rolePreference}
										onChange={(e) =>
											setDraft((prev) =>
												prev
													? { ...prev, rolePreference: e.target.value }
													: prev,
											)
										}
										style={{ ...inputStyle, cursor: "pointer" }}
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
						) : (
							<div style={{ display: "flex", gap: 24 }}>
								<div>
									<div
										style={{
											fontSize: 12,
											color: "var(--muted)",
											marginBottom: 2,
										}}
									>
										Industry
									</div>
									<div
										style={{
											fontSize: 14,
											fontWeight: 500,
											color: "var(--ink)",
										}}
									>
										{s.industryPreference || "Not specified"}
									</div>
								</div>
								<div>
									<div
										style={{
											fontSize: 12,
											color: "var(--muted)",
											marginBottom: 2,
										}}
									>
										Role
									</div>
									<div
										style={{
											fontSize: 14,
											fontWeight: 500,
											color: "var(--ink)",
										}}
									>
										{s.rolePreference || "Not specified"}
									</div>
								</div>
							</div>
						)}
					</div>

					<WorkloadPicker
						value={editing && d ? d.preferredWorkload : s.preferredWorkload}
						editing={editing}
						onChange={(v) =>
							setDraft((prev) =>
								prev ? { ...prev, preferredWorkload: v } : prev,
							)
						}
					/>
					<GoalsInterestsEditor
						label="Career Goals"
						items={editing && d ? d.careerGoals : s.careerGoals}
						editing={editing}
						onChange={(items) =>
							setDraft((prev) =>
								prev ? { ...prev, careerGoals: items } : prev,
							)
						}
					/>
					<GoalsInterestsEditor
						label="Interests"
						items={editing && d ? d.interests : s.interests}
						editing={editing}
						onChange={(items) =>
							setDraft((prev) => (prev ? { ...prev, interests: items } : prev))
						}
					/>
				</div>
			</div>
		</div>
	);
}
