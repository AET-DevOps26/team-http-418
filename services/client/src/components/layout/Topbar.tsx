import { useRouterState } from "@tanstack/react-router";
import { Bell, Globe, Search } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
	"/dashboard": "Home",
	"/progress": "Academic Progress",
	"/courses": "Courses",
	"/planner": "My Plan",
	"/advisor": "AI Advisor",
	"/profile": "Profile & Goals",
};

export function Topbar() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const pageLabel =
		PAGE_LABELS[pathname] ??
		Object.entries(PAGE_LABELS).find(([p]) =>
			pathname.startsWith(`${p}/`),
		)?.[1] ??
		"Dashboard";

	return (
		<header className="topbar">
			<div className="topbar-breadcrumb">
				<span>AIDAN</span>
				<span className="topbar-breadcrumb-sep">·</span>
				<span className="topbar-breadcrumb-current">{pageLabel}</span>
			</div>

			<div className="topbar-search">
				<Search size={13} strokeWidth={2} />
				<span>Search courses…</span>
			</div>

			<button
				type="button"
				className="topbar-icon-btn"
				aria-label="Notifications"
			>
				<Bell size={15} strokeWidth={1.75} />
			</button>

			<button type="button" className="topbar-icon-btn" aria-label="Language">
				<Globe size={15} strokeWidth={1.75} />
			</button>
		</header>
	);
}
