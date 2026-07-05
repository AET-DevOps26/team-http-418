import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	Home,
	LogOut,
	Map as MapIcon,
	MessageCircle,
	TrendingUp,
} from "lucide-react";
import { logout } from "#/api";

const mainNav = [
	{ label: "Home", icon: Home, href: "/dashboard" },
	{ label: "Progress", icon: TrendingUp, href: "/progress" },
	{ label: "Courses", icon: BookOpen, href: "/courses" },
	{ label: "My Plan", icon: MapIcon, href: "/planner" },
];

const aiNav = [{ label: "Advisor", icon: MessageCircle, href: "/advisor" }];

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
					<Link
						key={href}
						to={href}
						className={`nav-item${isActive(href) ? " nav-item--active" : ""}`}
					>
						<Icon size={16} strokeWidth={1.75} />
						{label}
					</Link>
				))}

				<span className="sidebar-section-label">AI</span>

				{aiNav.map(({ label, icon: Icon, href }) => (
					<Link
						key={href}
						to={href}
						className={`nav-item${isActive(href) ? " nav-item--active" : ""}`}
					>
						<Icon size={16} strokeWidth={1.75} />
						{label}
					</Link>
				))}
			</nav>

			<div className="sidebar-footer">
				<Link to="/profile" className="sidebar-avatar" title="Profile">
					TU
				</Link>
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
