import { logout } from "#/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate({ to: "/login" });
	}

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Dashboard</h1>
			<button
				type="button"
				onClick={handleLogout}
				className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
			>
				Logout
			</button>
		</div>
	);
}
