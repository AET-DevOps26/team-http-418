const STEPS = ["Program", "Documents", "Goals"];

export function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				marginBottom: 32,
				gap: 0,
			}}
		>
			{STEPS.map((label, i) => {
				const stepNum = (i + 1) as 1 | 2 | 3;
				const done = stepNum < currentStep;
				const active = stepNum === currentStep;
				return (
					<div key={label} style={{ display: "flex", alignItems: "center" }}>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
							}}
						>
							<div
								style={{
									width: 32,
									height: 32,
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 13,
									fontWeight: 700,
									background: done
										? "linear-gradient(135deg, #8A57E0, #2D6FB5)"
										: active
											? "linear-gradient(135deg, #8A57E0, #2D6FB5)"
											: "#E2E7EF",
									color: done || active ? "#fff" : "#6E7E94",
									boxShadow: active
										? "0 2px 8px rgba(138,87,224,0.35)"
										: "none",
									transition: "all 0.2s",
								}}
							>
								{done ? "✓" : stepNum}
							</div>
							<span
								style={{
									marginTop: 6,
									fontSize: 11,
									fontWeight: active ? 600 : 400,
									color: active ? "#8A57E0" : done ? "#2D6FB5" : "#6E7E94",
									letterSpacing: "0.03em",
								}}
							>
								{label}
							</span>
						</div>
						{i < STEPS.length - 1 && (
							<div
								style={{
									width: 80,
									height: 2,
									marginBottom: 18,
									background: done
										? "linear-gradient(90deg, #8A57E0, #2D6FB5)"
										: "#E2E7EF",
									transition: "background 0.3s",
								}}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
}
