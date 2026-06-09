import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "#/api";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: () => {
		if (!isAuthenticated()) throw redirect({ to: "/login" });
	},
	component: () => <Outlet />,
});
