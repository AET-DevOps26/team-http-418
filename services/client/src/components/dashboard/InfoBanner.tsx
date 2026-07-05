import type { ReactNode } from "react";

type Props = {
	icon?: ReactNode;
	title: string;
	description: string;
	action: ReactNode;
};

export function InfoBanner({ icon, title, description, action }: Props) {
	return (
		<div
			style={{
				background: "var(--blue-50)",
				border: "1px solid var(--blue-100, #dbeafe)",
				borderRadius: "var(--r-md)",
				padding: "14px 16px",
				display: "flex",
				gap: 12,
				alignItems: "flex-start",
			}}
		>
			{icon && (
				<div
					style={{ color: "var(--blue-500)", flexShrink: 0, marginTop: 1 }}
				>
					{icon}
				</div>
			)}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontSize: 13,
						fontWeight: 600,
						color: "var(--ink)",
						marginBottom: 2,
					}}
				>
					{title}
				</div>
				<div
					style={{
						fontSize: 12,
						color: "var(--muted)",
						marginBottom: 10,
						lineHeight: 1.45,
					}}
				>
					{description}
				</div>
				{action}
			</div>
		</div>
	);
}
