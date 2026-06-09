import { isAuthenticated } from "#/api";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" });
	},
	component: () => <Outlet />,
});
