import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronsLeft,
	ChevronsRight,
	Home,
	LogOut,
	Map as MapIcon,
	MessageCircle,
	TrendingUp,
} from "lucide-react";
import { logout } from "#/api";
import { useProfile } from "#/hooks/useProfile";

const mainNav = [
	{ label: "Home", icon: Home, href: "/dashboard" },
	{ label: "Progress", icon: TrendingUp, href: "/progress" },
	{ label: "Courses", icon: BookOpen, href: "/courses" },
	{ label: "My Plan", icon: MapIcon, href: "/planner" },
	{ label: "Advisor", icon: MessageCircle, href: "/advisor" },
];

type Props = {
	collapsed: boolean;
	onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { data: profile } = useProfile();
	const firstName = profile?.student?.firstName;

	async function handleLogout() {
		await logout();
		navigate({ to: "/login" });
	}

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(`${href}/`);
	}

	return (
		<aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
			<div className="sidebar-brand">
				<div className="sidebar-brand-mark">A</div>
				{!collapsed && <span className="sidebar-brand-name">AIDAN</span>}
			</div>

			<nav className="sidebar-nav">
				{mainNav.map(({ label, icon: Icon, href }) => (
					<Link
						key={href}
						to={href}
						title={label}
						className={`nav-item${isActive(href) ? " nav-item--active" : ""}`}
					>
						<Icon size={16} strokeWidth={1.75} />
						{!collapsed && label}
					</Link>
				))}
			</nav>

			<div
				className={`sidebar-footer${isActive("/profile") ? " sidebar-footer--active" : ""}`}
			>
				<Link to="/profile" className="sidebar-avatar" title="Profile">
					{firstName ? firstName.charAt(0).toUpperCase() : "TU"}
				</Link>
				{!collapsed && (
					<span className="sidebar-user-name">
						{firstName || "TUM Student"}
					</span>
				)}
				<button
					type="button"
					className="sidebar-logout-btn"
					onClick={handleLogout}
					title="Log out"
				>
					<LogOut size={15} strokeWidth={1.75} />
				</button>
			</div>

			<button
				type="button"
				className="sidebar-toggle-btn"
				onClick={onToggle}
				title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
			>
				{collapsed ? (
					<ChevronsRight size={16} strokeWidth={1.75} />
				) : (
					<ChevronsLeft size={16} strokeWidth={1.75} />
				)}
			</button>
		</aside>
	);
}
