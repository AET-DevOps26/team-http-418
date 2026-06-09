import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthError, isAuthenticated, login } from "#/api";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		if (isAuthenticated()) throw redirect({ to: "/dashboard" });
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [tumId, setTumId] = useState("");
	const [password, setPassword] = useState("");
	const [touched, setTouched] = useState({ tumId: false, password: false });

	const mutation = useMutation({
		mutationFn: () => login(tumId, password),
		onSuccess: () => navigate({ to: "/dashboard" }),
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
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
				<h1 className="text-2xl font-bold mb-6">Sign in</h1>
				{errorMessage && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
						{errorMessage}
					</div>
				)}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (!isDisabled) mutation.mutate();
					}}
				>
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" htmlFor="tumId">
							TUM ID
						</label>
						<input
							id="tumId"
							type="text"
							value={tumId}
							onChange={(e) => setTumId(e.target.value)}
							onBlur={() => setTouched((t) => ({ ...t, tumId: true }))}
							className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="ga12abc"
						/>
						{errors.tumId && (
							<p className="mt-1 text-xs text-red-600">{errors.tumId}</p>
						)}
					</div>
					<div className="mb-6">
						<label
							className="block text-sm font-medium mb-1"
							htmlFor="password"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onBlur={() => setTouched((t) => ({ ...t, password: true }))}
							className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{errors.password && (
							<p className="mt-1 text-xs text-red-600">{errors.password}</p>
						)}
					</div>
					<button
						type="submit"
						disabled={isDisabled}
						className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
					>
						{mutation.isPending ? "Signing in…" : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}
