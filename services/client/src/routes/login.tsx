import { useMutation } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { AuthError, isAuthenticated, login } from "#/api";
import { getProfile } from "#/api/profile";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		if (isAuthenticated()) throw redirect({ to: "/dashboard" });
	},
	component: LoginPage,
});

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
			{/* Large purple→blue gradient circle — top right */}
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
			{/* Small gold circle — bottom left */}
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
			{/* Lavender ring — center left */}
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
			{/* Navy dot cluster — bottom right */}
			<div
				style={{
					position: "absolute",
					bottom: "60px",
					right: "80px",
					width: "60px",
					height: "60px",
					borderRadius: "50%",
					background: "rgba(11,31,51,0.08)",
					animation: "pulse 12s ease-in-out infinite 2s",
				}}
			/>
			{/* Dashed blue ring — top left */}
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
				@keyframes bounce {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-18px); }
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; transform: scale(1); }
					50% { opacity: 0.6; transform: scale(1.08); }
				}
			`}</style>
		</div>
	);
}

function LoginPage() {
	const navigate = useNavigate();
	const [tumId, setTumId] = useState("");
	const [password, setPassword] = useState("");
	const [touched, setTouched] = useState({ tumId: false, password: false });

	const mutation = useMutation({
		mutationFn: () => login(tumId, password),
		onSuccess: async () => {
			try {
				const profile = await getProfile();
				const raw = profile as { student?: { onboardingCompleted?: boolean } };
				if (raw?.student?.onboardingCompleted === false) {
					void navigate({ to: "/onboarding" });
				} else {
					void navigate({ to: "/dashboard" });
				}
			} catch {
				void navigate({ to: "/dashboard" });
			}
		},
	});

	const errors = {
		tumId: touched.tumId && !tumId ? "TUM ID is required" : null,
		password: touched.password && !password ? "Password is required" : null,
	};

	const isDisabled = !tumId || !password || mutation.isPending;

	let errorMessage: string | null = null;
	if (mutation.isError) {
		const err = mutation.error;
		errorMessage =
			err instanceof AuthError && err.status === 401
				? "Invalid TUM ID or password"
				: err instanceof Error
					? err.message
					: "An error occurred";
	}

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
			}}
		>
			<FloatingShapes />

			<div
				style={{
					position: "relative",
					zIndex: 1,
					width: "100%",
					maxWidth: "420px",
					margin: "0 16px",
					background: "rgba(255,255,255,0.9)",
					backdropFilter: "blur(12px)",
					WebkitBackdropFilter: "blur(12px)",
					borderRadius: "14px",
					border: "1px solid #E2E7EF",
					boxShadow:
						"0 8px 32px rgba(138,87,224,0.12), 0 1px 4px rgba(0,0,0,0.08)",
					overflow: "hidden",
				}}
			>
				{/* Accent bar */}
				<div
					style={{
						height: "4px",
						background: "linear-gradient(90deg, #8A57E0, #2D6FB5, #F0A800)",
					}}
				/>

				<div style={{ padding: "36px 40px 40px" }}>
					{/* Brand header */}
					<div style={{ textAlign: "center", marginBottom: "32px" }}>
						<div
							style={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: "56px",
								height: "56px",
								borderRadius: "14px",
								background: "linear-gradient(135deg, #8A57E0, #2D6FB5)",
								boxShadow: "0 4px 16px rgba(138,87,224,0.3)",
								marginBottom: "16px",
							}}
						>
							<svg
								width="28"
								height="28"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"
									fill="rgba(255,255,255,0.95)"
								/>
								<path
									d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"
									fill="rgba(255,255,255,0.7)"
								/>
							</svg>
						</div>
						<h1
							style={{
								margin: "0 0 6px",
								fontSize: "22px",
								fontWeight: 700,
								color: "#0B1F33",
								letterSpacing: "-0.3px",
							}}
						>
							Welcome to AIDAN
						</h1>
						<p style={{ margin: 0, fontSize: "14px", color: "#6E7E94" }}>
							Sign in with your TUM credentials
						</p>
					</div>

					{/* Error banner */}
					{errorMessage && (
						<div
							style={{
								marginBottom: "20px",
								padding: "12px 14px",
								background: "#FBE3E0",
								border: "1px solid rgba(192,58,46,0.2)",
								borderRadius: "10px",
								color: "#C03A2E",
								fontSize: "13px",
								lineHeight: 1.5,
							}}
						>
							{errorMessage}
						</div>
					)}

					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!isDisabled) mutation.mutate();
						}}
					>
						{/* TUM ID field */}
						<div style={{ marginBottom: "16px" }}>
							<label
								htmlFor="tumId"
								style={{
									display: "block",
									fontSize: "13px",
									fontWeight: 500,
									color: "#0B1F33",
									marginBottom: "6px",
								}}
							>
								TUM ID
							</label>
							<input
								id="tumId"
								type="text"
								value={tumId}
								onChange={(e) => setTumId(e.target.value)}
								onBlur={() => setTouched((t) => ({ ...t, tumId: true }))}
								placeholder="ga12abc"
								style={{
									width: "100%",
									boxSizing: "border-box",
									padding: "10px 12px",
									fontSize: "14px",
									color: "#0B1F33",
									background: "#FFFFFF",
									border: errors.tumId
										? "1px solid #C03A2E"
										: "1px solid #E2E7EF",
									borderRadius: "10px",
									outline: "none",
									transition: "border-color 0.15s, box-shadow 0.15s",
									fontFamily: "inherit",
								}}
								onFocus={(e) => {
									e.target.style.borderColor = "#2D6FB5";
									e.target.style.boxShadow = "0 0 0 3px rgba(46,111,181,0.12)";
								}}
								onBlurCapture={(e) => {
									e.target.style.borderColor = errors.tumId
										? "#C03A2E"
										: "#E2E7EF";
									e.target.style.boxShadow = "none";
								}}
							/>
							{errors.tumId && (
								<p
									style={{
										margin: "4px 0 0",
										fontSize: "12px",
										color: "#C03A2E",
									}}
								>
									{errors.tumId}
								</p>
							)}
						</div>

						{/* Password field */}
						<div style={{ marginBottom: "24px" }}>
							<label
								htmlFor="password"
								style={{
									display: "block",
									fontSize: "13px",
									fontWeight: 500,
									color: "#0B1F33",
									marginBottom: "6px",
								}}
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onBlur={() => setTouched((t) => ({ ...t, password: true }))}
								style={{
									width: "100%",
									boxSizing: "border-box",
									padding: "10px 12px",
									fontSize: "14px",
									color: "#0B1F33",
									background: "#FFFFFF",
									border: errors.password
										? "1px solid #C03A2E"
										: "1px solid #E2E7EF",
									borderRadius: "10px",
									outline: "none",
									transition: "border-color 0.15s, box-shadow 0.15s",
									fontFamily: "inherit",
								}}
								onFocus={(e) => {
									e.target.style.borderColor = "#2D6FB5";
									e.target.style.boxShadow = "0 0 0 3px rgba(46,111,181,0.12)";
								}}
								onBlurCapture={(e) => {
									e.target.style.borderColor = errors.password
										? "#C03A2E"
										: "#E2E7EF";
									e.target.style.boxShadow = "none";
								}}
							/>
							{errors.password && (
								<p
									style={{
										margin: "4px 0 0",
										fontSize: "12px",
										color: "#C03A2E",
									}}
								>
									{errors.password}
								</p>
							)}
						</div>

						{/* Submit button */}
						<button
							type="submit"
							disabled={isDisabled}
							style={{
								width: "100%",
								padding: "12px",
								fontSize: "14px",
								fontWeight: 600,
								color: "#FFFFFF",
								background: isDisabled
									? "linear-gradient(135deg, rgba(138,87,224,0.5), rgba(45,111,181,0.5))"
									: "linear-gradient(135deg, #8A57E0, #2D6FB5)",
								border: "none",
								borderRadius: "10px",
								cursor: isDisabled ? "not-allowed" : "pointer",
								boxShadow: isDisabled
									? "none"
									: "0 4px 14px rgba(138,87,224,0.35)",
								transition: "box-shadow 0.2s, opacity 0.2s",
								fontFamily: "inherit",
								letterSpacing: "0.01em",
							}}
							onMouseEnter={(e) => {
								if (!isDisabled)
									e.currentTarget.style.boxShadow =
										"0 6px 20px rgba(138,87,224,0.45)";
							}}
							onMouseLeave={(e) => {
								if (!isDisabled)
									e.currentTarget.style.boxShadow =
										"0 4px 14px rgba(138,87,224,0.35)";
							}}
						>
							{mutation.isPending ? "Signing in…" : "Sign in"}
						</button>
					</form>

					<p
						style={{
							margin: "20px 0 0",
							textAlign: "center",
							fontSize: "13px",
							color: "#6E7E94",
						}}
					>
						Don't have an account?{" "}
						<Link
							to="/register"
							style={{
								color: "#8A57E0",
								fontWeight: 500,
								textDecoration: "none",
							}}
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
