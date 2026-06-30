import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { ScheduleConflict } from "#/api/types";

type Props = {
	conflicts: ScheduleConflict[];
	onDismiss: () => void;
};

export function ConflictBanner({ conflicts, onDismiss }: Props) {
	const [expanded, setExpanded] = useState(false);
	if (conflicts?.length === 0) return null;

	const hasError = conflicts.some((c) => c.severity === "ERROR");

	return (
		<div
			style={{
				background: hasError ? "#fff0ee" : "#fff8ec",
				border: `1px solid ${hasError ? "var(--danger)" : "var(--accent)"}`,
				borderRadius: "var(--r-md)",
				padding: "10px 14px",
				marginBottom: 16,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					justifyContent: "space-between",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<AlertTriangle
						size={16}
						color={hasError ? "var(--danger)" : "var(--accent)"}
					/>
					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 0,
							fontSize: 13,
							fontWeight: 500,
							fontFamily: "var(--font-sans)",
							color: "var(--ink)",
						}}
					>
						{conflicts?.length} schedule{" "}
						{conflicts?.length === 1 ? "conflict" : "conflicts"}
					</button>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					<a
						href="/planner"
						style={{
							fontSize: 12,
							fontWeight: 500,
							color: "var(--blue-600)",
							textDecoration: "none",
						}}
					>
						View roadmap
					</a>
					<button
						type="button"
						onClick={onDismiss}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							padding: 2,
							color: "var(--muted)",
							display: "flex",
						}}
					>
						<X size={14} />
					</button>
				</div>
			</div>
			{expanded && (
				<ul
					style={{
						margin: "8px 0 0",
						padding: "0 0 0 24px",
						display: "flex",
						flexDirection: "column",
						gap: 4,
					}}
				>
					{conflicts.map((c) => (
						<li
							key={c.message}
							style={{
								fontSize: 12,
								color: "var(--ink-soft)",
								lineHeight: 1.5,
							}}
						>
							{c.message}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
