import { createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useState } from "react";
// import { toast } from "sonner";
// import type { StudentProfile } from "#/api/types";
import { GoalsInterestsEditor } from "#/components/profile/GoalsInterestsEditor";
import { ProfileHeader } from "#/components/profile/ProfileHeader";
import { StudyProgramList } from "#/components/profile/StudyProgramList";
import { WorkloadPicker } from "#/components/profile/WorkloadPicker";
import { useProfile } from "#/hooks/useProfile";
import { useUpdateProfile } from "#/hooks/useUpdateProfile";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

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
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<div className="card" style={{ padding: 24 }}>
						<div style={{ display: "flex", gap: 16 }}>
							<div
								className="skel"
								style={{ width: 56, height: 56, borderRadius: "50%" }}
							/>
							<div style={{ flex: 1 }}>
								<div
									className="skel"
									style={{ height: 22, width: 180, marginBottom: 8 }}
								/>
								<div className="skel" style={{ height: 14, width: 260 }} />
							</div>
						</div>
					</div>
					<div className="card" style={{ padding: 24 }}>
						<div
							className="skel"
							style={{ height: 11, width: 120, marginBottom: 16 }}
						/>
						{[0, 1].map((i) => (
							<div
								key={i}
								className="skel"
								style={{ height: 52, width: "100%", marginBottom: 10 }}
							/>
						))}
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<div className="card" style={{ padding: 24 }}>
						<div
							className="skel"
							style={{ height: 11, width: 140, marginBottom: 16 }}
						/>
						<div className="skel" style={{ height: 36, width: 120 }} />
					</div>
					<div className="card" style={{ padding: 24 }}>
						<div
							className="skel"
							style={{ height: 11, width: 100, marginBottom: 16 }}
						/>
						<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className="skel"
									style={{ height: 24, width: 100 }}
								/>
							))}
						</div>
					</div>
					<div className="card" style={{ padding: 24 }}>
						<div
							className="skel"
							style={{ height: 11, width: 80, marginBottom: 16 }}
						/>
						<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
							{[0, 1, 2].map((i) => (
								<div
									key={i}
									className="skel"
									style={{ height: 24, width: 110 }}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type Draft = {
	preferredWorkload: number;
	careerGoals: string[];
	interests: string[];
};

function ProfilePage() {
	const { data: profile, isLoading, isError, refetch } = useProfile();
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

	// function computeDirtyFields(): StudentProfileUpdate | null { TODO fix for complete profile send
	// 	if (!draft || !profile) return null;
	// 	const dirty: Partial<StudentProfileUpdate> = {};
	// 	if (draft.preferredWorkload !== profile.preferredWorkload) {
	// 		dirty.preferredWorkload = draft.preferredWorkload;
	// 	}
	// 	if (
	// 		JSON.stringify(draft.careerGoals) !== JSON.stringify(profile.careerGoals)
	// 	) {
	// 		dirty.careerGoals = draft.careerGoals;
	// 	}
	// 	if (JSON.stringify(draft.interests) !== JSON.stringify(profile.interests)) {
	// 		dirty.interests = draft.interests;
	// 	}
	// 	return Object.keys(dirty).length > 0 ? dirty : null;
	// }

	function handleSave() {
		// const dirtyFields = computeDirtyFields(); TODO
		// if (!dirtyFields) {
		// 	setEditing(false);
		// 	setDraft(null);
		// 	return;
		// }
		// mutation.mutate(dirtyFields, {
		// 	onSuccess: () => {
		// 		toast.success("Profile updated");
		// 		setEditing(false);
		// 		setDraft(null);
		// 	},
		// 	onError: () => {
		// 		toast.error("Failed to update profile");
		// 	},
		// });
	}

	const workload =
		editing && draft
			? draft.preferredWorkload
			: profile.student.preferredWorkload;
	const goals =
		editing && draft ? draft.careerGoals : profile.student.careerGoals;
	const interests =
		editing && draft ? draft.interests : profile.student.interests;

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
					Profile &amp; Goals
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
				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<ProfileHeader profile={profile} />
					<StudyProgramList programs={[profile.student.studyProgram]} />
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					<WorkloadPicker
						value={workload}
						editing={editing}
						onChange={(v) =>
							setDraft((d) => (d ? { ...d, preferredWorkload: v } : d))
						}
					/>
					<GoalsInterestsEditor
						label="Career Goals"
						items={goals}
						editing={editing}
						onChange={(items) =>
							setDraft((d) => (d ? { ...d, careerGoals: items } : d))
						}
					/>
					<GoalsInterestsEditor
						label="Interests"
						items={interests}
						editing={editing}
						onChange={(items) =>
							setDraft((d) => (d ? { ...d, interests: items } : d))
						}
					/>
				</div>
			</div>
		</div>
	);
}
