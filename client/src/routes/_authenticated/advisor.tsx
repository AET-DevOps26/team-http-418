import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ConversationList } from "#/components/advisor/ConversationList";

export const Route = createFileRoute("/_authenticated/advisor")({
	component: AdvisorLayout,
});

function AdvisorLayout() {
	return (
		<div className="advisor-layout">
			<aside className="advisor-sidebar">
				<ConversationList />
			</aside>
			<div className="advisor-main">
				<Outlet />
			</div>
		</div>
	);
}
