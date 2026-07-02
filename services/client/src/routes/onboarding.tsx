import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { completeOnboarding } from "#/api/profile";
import type { StudentProfileUpdate } from "#/api/types";
import { DocumentsStep } from "#/components/onboarding/DocumentsStep";
import { GoalsStep } from "#/components/onboarding/GoalsStep";
import { ProgramStep } from "#/components/onboarding/ProgramStep";
import type { OnboardingStep3 } from "#/hooks/useOnboarding";
import { useOnboarding } from "#/hooks/useOnboarding";
import { isAuthenticated } from "#/api";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" });
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const [state, dispatch] = useOnboarding();

	const finishMutation = useMutation({
		mutationFn: (data: Partial<StudentProfileUpdate>) => completeOnboarding(data),
		onSuccess: () => {
			sessionStorage.removeItem("onboarding-state");
			void navigate({ to: "/dashboard" });
		},
	});

	function buildProfileData(step3?: OnboardingStep3): Partial<StudentProfileUpdate> {
		const data: Partial<StudentProfileUpdate> = {};
		if (state.step1) {
			data.studyProgramId = state.step1.studyProgramId;
			data.semester = state.step1.semester;
			data.expectedGraduation = state.step1.expectedGraduation;
		}
		if (step3) {
			if (step3.industryPreference) data.industryPreference = step3.industryPreference;
			if (step3.rolePreference) data.rolePreference = step3.rolePreference;
			if (step3.careerGoals.length > 0) data.careerGoals = step3.careerGoals;
			if (step3.interests.length > 0) data.interests = step3.interests;
			if (step3.preferredWorkload > 0) data.preferredWorkload = step3.preferredWorkload;
		}
		return data;
	}

	if (state.currentStep === 1) {
		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "linear-gradient(135deg, #F4F1FB, #EAEEFA)",
					fontFamily: "Inter, system-ui, sans-serif",
					padding: "24px 16px",
				}}
			>
				<div
					style={{
						position: "relative",
						zIndex: 1,
						width: "100%",
						maxWidth: "700px",
						background: "rgba(255,255,255,0.92)",
						backdropFilter: "blur(12px)",
						WebkitBackdropFilter: "blur(12px)",
						borderRadius: "14px",
						border: "1px solid #E2E7EF",
						boxShadow: "0 8px 32px rgba(138,87,224,0.12), 0 1px 4px rgba(0,0,0,0.08)",
						overflow: "hidden",
					}}
				>
					<div style={{ height: "4px", background: "linear-gradient(90deg, #8A57E0, #2D6FB5, #F0A800)" }} />
					<div style={{ padding: "36px 40px 40px" }}>
						<div style={{ textAlign: "center", marginBottom: 8 }}>
							<h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0B1F33" }}>
								Set up your profile
							</h1>
							<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
								Help us personalize your academic journey
							</p>
						</div>
						<StepIndicatorInline currentStep={1} />
						<ProgramStep
							data={state.step1}
							onNext={(data) => {
								dispatch({ type: "SET_STEP1", data });
								dispatch({ type: "NEXT_STEP" });
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	if (state.currentStep === 2) {
		return (
			<WizardShell currentStep={2} onBack={() => dispatch({ type: "PREV_STEP" })}>
				<DocumentsStep
					data={state.step2}
					onUpdate={(data) => dispatch({ type: "UPDATE_STEP2", data })}
					onNext={() => dispatch({ type: "NEXT_STEP" })}
					onSkip={() => dispatch({ type: "NEXT_STEP" })}
				/>
			</WizardShell>
		);
	}

	return (
		<WizardShell currentStep={3} onBack={() => dispatch({ type: "PREV_STEP" })}>
			<GoalsStep
				data={state.step3}
				isLoading={finishMutation.isPending}
				onComplete={(step3Data) => {
					dispatch({ type: "SET_STEP3", data: step3Data });
					finishMutation.mutate(buildProfileData(step3Data));
				}}
				onSkip={() => finishMutation.mutate(buildProfileData())}
			/>
		</WizardShell>
	);
}

function StepIndicatorInline({ currentStep }: { currentStep: 1 | 2 | 3 }) {
	const steps = ["Program", "Documents", "Goals"];
	return (
		<div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 32, gap: 0 }}>
			{steps.map((label, i) => {
				const stepNum = (i + 1) as 1 | 2 | 3;
				const done = stepNum < currentStep;
				const active = stepNum === currentStep;
				return (
					<div key={label} style={{ display: "flex", alignItems: "center" }}>
						<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
							<div style={{
								width: 32, height: 32, borderRadius: "50%",
								display: "flex", alignItems: "center", justifyContent: "center",
								fontSize: 13, fontWeight: 700,
								background: done || active ? "linear-gradient(135deg, #8A57E0, #2D6FB5)" : "#E2E7EF",
								color: done || active ? "#fff" : "#6E7E94",
								boxShadow: active ? "0 2px 8px rgba(138,87,224,0.35)" : "none",
							}}>{done ? "✓" : stepNum}</div>
							<span style={{
								marginTop: 6, fontSize: 11,
								fontWeight: active ? 600 : 400,
								color: active ? "#8A57E0" : done ? "#2D6FB5" : "#6E7E94",
							}}>{label}</span>
						</div>
						{i < steps.length - 1 && (
							<div style={{
								width: 80, height: 2, marginBottom: 18,
								background: done ? "linear-gradient(90deg, #8A57E0, #2D6FB5)" : "#E2E7EF",
							}} />
						)}
					</div>
				);
			})}
		</div>
	);
}

function WizardShell({ currentStep, onBack, children }: {
	currentStep: 1 | 2 | 3;
	onBack?: () => void;
	children: ReactNode;
}) {
	return (
		<div style={{
			minHeight: "100vh",
			display: "flex", alignItems: "center", justifyContent: "center",
			background: "linear-gradient(135deg, #F4F1FB, #EAEEFA)",
			fontFamily: "Inter, system-ui, sans-serif",
			padding: "24px 16px",
		}}>
			<div style={{
				position: "relative", zIndex: 1, width: "100%", maxWidth: "700px",
				background: "rgba(255,255,255,0.92)",
				backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
				borderRadius: "14px", border: "1px solid #E2E7EF",
				boxShadow: "0 8px 32px rgba(138,87,224,0.12), 0 1px 4px rgba(0,0,0,0.08)",
				overflow: "hidden",
			}}>
				<div style={{ height: "4px", background: "linear-gradient(90deg, #8A57E0, #2D6FB5, #F0A800)" }} />
				<div style={{ padding: "36px 40px 40px" }}>
					<div style={{ textAlign: "center", marginBottom: 8 }}>
						<h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0B1F33" }}>
							Set up your profile
						</h1>
						<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
							Help us personalize your academic journey
						</p>
					</div>
					<StepIndicatorInline currentStep={currentStep} />
					{onBack && (
						<button
							type="button"
							onClick={onBack}
							style={{
								marginBottom: 20,
								padding: "7px 14px",
								fontSize: 13, fontWeight: 500, color: "#6E7E94",
								background: "none", border: "1px solid #E2E7EF",
								borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
							}}
						>
							← Back
						</button>
					)}
					{children}
				</div>
			</div>
		</div>
	);
}
