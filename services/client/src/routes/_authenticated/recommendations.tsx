import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/recommendations")({
	loader: () => {
		throw redirect({ to: "/courses", search: { view: "recommended" } });
	},
	component: () => null,
});
