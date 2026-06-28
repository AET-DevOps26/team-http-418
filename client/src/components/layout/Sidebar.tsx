import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	Clock,
	Compass,
	Home,
	LogOut,
	Map as MapIcon,
	Settings,
	Sparkles,
	TrendingUp,
	User,
} from "lucide-react";
import { logout } from "#/api";

const mainNav = [
	{ label: "Overview", icon: Home, href: "/dashboard" },
	{ label: "Courses", icon: BookOpen, href: "/courses" },
	{ label: "Schedule", icon: Clock, href: "/schedule" },
	{ label: "Planner", icon: MapIcon, href: "/planner" },
	{ label: "Explore", icon: Compass, href: "/explore" },
	{ label: "Insights", icon: Sparkles, href: "/insights" },
	{ label: "Progress", icon: TrendingUp, href: "/progress" },
];

const accountNav = [
	{ label: "Profile & goals", icon: User, href: "/profile" },
	{ label: "Preferences", icon: Settings, href: "/preferences" },
];

export function Sidebar() {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	async function handleLogout() {
		await logout();
		navigate({ to: "/login" });
	}

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	return (
		<aside className="sidebar">
			<div className="sidebar-brand">
				<div className="sidebar-brand-mark">A</div>
				<span className="sidebar-brand-name">AIDAN</span>
			</div>

			<nav className="sidebar-nav">
				{mainNav.map(({ label, icon: Icon, href }) => (
					<a
						key={href}
						href={href}
						className={`nav-item${isActive(href) ? " nav-item--active" : ""}`}
					>
						<Icon size={16} strokeWidth={1.75} />
						{label}
					</a>
				))}

				<span className="sidebar-section-label">Account</span>

				{accountNav.map(({ label, icon: Icon, href }) => (
					<a
						key={href}
						href={href}
						className={`nav-item${isActive(href) ? " nav-item--active" : ""}`}
					>
						<Icon size={16} strokeWidth={1.75} />
						{label}
					</a>
				))}
			</nav>

			<div className="sidebar-footer">
				<div className="sidebar-avatar">TU</div>
				<span className="sidebar-user-name">TUM Student</span>
				<button
					type="button"
					className="sidebar-logout-btn"
					onClick={handleLogout}
					title="Log out"
				>
					<LogOut size={15} strokeWidth={1.75} />
				</button>
			</div>
		</aside>
	);
}
