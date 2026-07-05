import type { ReactNode } from "react";
import { StepIndicator } from "./StepIndicator";

function FloatingShapes() {
	return (
		<div
			aria-hidden="true"
			style={{
				position: "fixed",
				inset: 0,
				pointerEvents: "none",
				overflow: "hidden",
				zIndex: 0,
			}}
		>
			<div
				style={{
					position: "absolute",
					top: "-120px",
					right: "-120px",
					width: "420px",
					height: "420px",
					borderRadius: "50%",
					background:
						"linear-gradient(135deg, rgba(138,87,224,0.18), rgba(45,111,181,0.14))",
					animation: "spin 60s linear infinite",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "80px",
					left: "60px",
					width: "80px",
					height: "80px",
					borderRadius: "50%",
					background: "rgba(240,168,0,0.22)",
					animation: "bounce 8s ease-in-out infinite",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: "40%",
					left: "-60px",
					width: "200px",
					height: "200px",
					borderRadius: "50%",
					border: "3px solid rgba(138,87,224,0.15)",
					animation: "pulse 10s ease-in-out infinite",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: "60px",
					left: "40px",
					width: "160px",
					height: "160px",
					borderRadius: "50%",
					border: "2px dashed rgba(45,111,181,0.2)",
					animation: "spinReverse 45s linear infinite",
				}}
			/>
			<style>{`
				@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
				@keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
				@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
				@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.08); } }
			`}</style>
		</div>
	);
}

type Props = {
	currentStep: 1 | 2 | 3;
	children: ReactNode;
	onBack?: () => void;
	onSkip?: () => void;
	onSkipAll?: () => void;
	onNext?: () => void;
	onStepClick?: (step: 1 | 2 | 3) => void;
	nextLabel?: string;
	nextDisabled?: boolean;
	isLoading?: boolean;
	showBack?: boolean;
	showSkip?: boolean;
};

export function WizardLayout({
	currentStep,
	children,
	onBack,
	onSkip,
	onSkipAll,
	onNext,
	onStepClick,
	nextLabel = "Next",
	nextDisabled = false,
	isLoading = false,
	showBack = true,
	showSkip = true,
}: Props) {
	const btnDisabled = nextDisabled || isLoading;

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #F4F1FB, #EAEEFA)",
				fontFamily: "Inter, system-ui, sans-serif",
				position: "relative",
				padding: "24px 16px",
			}}
		>
			<FloatingShapes />

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
					boxShadow:
						"0 8px 32px rgba(138,87,224,0.12), 0 1px 4px rgba(0,0,0,0.08)",
					overflow: "visible",
				}}
			>
				<div
					style={{
						height: "4px",
						background: "linear-gradient(90deg, #8A57E0, #2D6FB5, #F0A800)",
					}}
				/>

				<div style={{ padding: "36px 40px 40px" }}>
					<div style={{ textAlign: "center", marginBottom: 8 }}>
						<h1
							style={{
								margin: "0 0 4px",
								fontSize: 22,
								fontWeight: 700,
								color: "#0B1F33",
								letterSpacing: "-0.3px",
							}}
						>
							Set up your profile
						</h1>
						<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
							Help us personalize your academic journey
						</p>
						{onSkipAll && (
							<button
								type="button"
								onClick={onSkipAll}
								disabled={isLoading}
								style={{
									marginTop: 8,
									padding: 0,
									fontSize: 13,
									color: "#6E7E94",
									background: "none",
									border: "none",
									textDecoration: "underline",
									cursor: isLoading ? "not-allowed" : "pointer",
									fontFamily: "inherit",
								}}
							>
								Skip for now
							</button>
						)}
					</div>

					<StepIndicator currentStep={currentStep} onStepClick={onStepClick} />

					<div style={{ minHeight: 280 }}>{children}</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginTop: 32,
							paddingTop: 24,
							borderTop: "1px solid #E2E7EF",
						}}
					>
						<div>
							{showBack && currentStep > 1 && onBack && (
								<button
									type="button"
									onClick={onBack}
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
									← Back
								</button>
							)}
						</div>

						<div style={{ display: "flex", gap: 10 }}>
							{showSkip && onSkip && (
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
									{currentStep === 3 ? "Skip & Finish" : "Skip"}
								</button>
							)}
							{onNext && (
								<button
									type="button"
									onClick={onNext}
									disabled={btnDisabled}
									style={{
										padding: "9px 22px",
										fontSize: 14,
										fontWeight: 600,
										color: "#fff",
										background: btnDisabled
											? "linear-gradient(135deg, rgba(138,87,224,0.5), rgba(45,111,181,0.5))"
											: "linear-gradient(135deg, #8A57E0, #2D6FB5)",
										border: "none",
										borderRadius: 10,
										cursor: btnDisabled ? "not-allowed" : "pointer",
										boxShadow: btnDisabled
											? "none"
											: "0 4px 14px rgba(138,87,224,0.3)",
										fontFamily: "inherit",
										letterSpacing: "0.01em",
									}}
								>
									{isLoading ? "Saving…" : nextLabel}
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
