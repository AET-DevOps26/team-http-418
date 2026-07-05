import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
	const [collapsed, setCollapsed] = useState(() => {
		try {
			return localStorage.getItem("sidebar-collapsed") === "true";
		} catch {
			return false;
		}
	});

	function toggleSidebar() {
		setCollapsed((c) => {
			const next = !c;
			try {
				localStorage.setItem("sidebar-collapsed", String(next));
			} catch {}
			return next;
		});
	}

	return (
		<div className={`app${collapsed ? " app--sidebar-collapsed" : ""}`}>
			<Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
			<main className="main">
				<Topbar />
				<ToastProvider>
					<Outlet />
				</ToastProvider>
			</main>
		</div>
	);
}
