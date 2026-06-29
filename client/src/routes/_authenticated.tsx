import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "#/api";
import { Sidebar } from "#/components/layout/Sidebar";
import { Topbar } from "#/components/layout/Topbar";
import { ToastProvider } from "#/components/ui/Toast";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" });
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<div className="app">
			<Sidebar />
			<main className="main">
				<Topbar />
				<ToastProvider>
					<Outlet />
				</ToastProvider>
			</main>
		</div>
	);
}
