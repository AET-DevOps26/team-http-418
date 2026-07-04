import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { isAuthenticated } from "#/api";
import { completeOnboarding } from "#/api/profile";
import type { StudentProfile } from "#/api/types";
import { DocumentsStep } from "#/components/onboarding/DocumentsStep";
import { GoalsStep } from "#/components/onboarding/GoalsStep";
import { ProgramStep } from "#/components/onboarding/ProgramStep";
import { WizardLayout } from "#/components/onboarding/WizardLayout";
import type { OnboardingStep3 } from "#/hooks/useOnboarding";
import { useOnboarding } from "#/hooks/useOnboarding";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" });
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	const navigate = useNavigate();
	const [state, dispatch] = useOnboarding();
	const [submitError, setSubmitError] = useState<string | null>(null);

	const finishMutation = useMutation({
		mutationFn: (data: Partial<NonNullable<StudentProfile["student"]>>) =>
			completeOnboarding(data),
		onSuccess: () => {
			sessionStorage.removeItem("onboarding-state");
			void navigate({ to: "/dashboard" });
		},
		onError: () => {
			setSubmitError("Failed to save your profile. Please try again.");
		},
	});

	function buildProfileData(
		step3?: OnboardingStep3,
	): Partial<NonNullable<StudentProfile["student"]>> {
		const data: Partial<NonNullable<StudentProfile["student"]>> = {};
		if (state.step1) {
			data.studyProgramId = state.step1.studyProgramId;
			data.semester = state.step1.semester;
			data.expectedGraduation = state.step1.expectedGraduation;
		}
		if (step3) {
			if (step3.industryPreference)
				data.industryPreference = step3.industryPreference;
			if (step3.rolePreference) data.rolePreference = step3.rolePreference;
			if (step3.careerGoals.length > 0) data.careerGoals = step3.careerGoals;
			if (step3.interests.length > 0) data.interests = step3.interests;
			if (step3.preferredWorkload > 0)
				data.preferredWorkload = step3.preferredWorkload;
		}
		return data;
	}

	if (state.currentStep === 1) {
		return (
			<WizardLayout currentStep={1}>
				<ProgramStep
					data={state.step1}
					onNext={(data) => {
						dispatch({ type: "SET_STEP1", data });
						dispatch({ type: "NEXT_STEP" });
					}}
				/>
			</WizardLayout>
		);
	}

	if (state.currentStep === 2) {
		return (
			<WizardLayout
				currentStep={2}
				onBack={() => dispatch({ type: "PREV_STEP" })}
			>
				<DocumentsStep
					data={state.step2}
					onUpdate={(data) => dispatch({ type: "UPDATE_STEP2", data })}
					onNext={() => dispatch({ type: "NEXT_STEP" })}
					onSkip={() => dispatch({ type: "NEXT_STEP" })}
				/>
			</WizardLayout>
		);
	}

	return (
		<WizardLayout
			currentStep={3}
			onBack={() => dispatch({ type: "PREV_STEP" })}
		>
			{submitError && (
				<div
					style={{
						color: "#d32f2f",
						fontSize: 13,
						marginBottom: 12,
						padding: "8px 12px",
						background: "#fff5f5",
						border: "1px solid #fcc",
						borderRadius: 8,
					}}
				>
					{submitError}
				</div>
			)}
			<GoalsStep
				data={state.step3}
				isLoading={finishMutation.isPending}
				onComplete={(step3Data) => {
					setSubmitError(null);
					dispatch({ type: "SET_STEP3", data: step3Data });
					finishMutation.mutate(buildProfileData(step3Data));
				}}
				onSkip={() => {
					setSubmitError(null);
					finishMutation.mutate(buildProfileData());
				}}
			/>
		</WizardLayout>
	);
}
