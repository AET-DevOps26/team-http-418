import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { AlertSeverity, DashboardAlert } from "#/api/types";

const alertClass: Record<AlertSeverity, string> = {
	ERROR: "alert-error",
	WARNING: "alert-warn",
	INFO: "alert-info",
};

const AlertIcon = ({ severity }: { severity: AlertSeverity }) => {
	const props = { size: 14, strokeWidth: 2, style: { flexShrink: 0 } };
	if (severity === "ERROR")
		return <AlertCircle {...props} color="var(--danger)" />;
	if (severity === "WARNING")
		return <AlertTriangle {...props} color="var(--accent)" />;
	return <Info {...props} color="var(--blue-500)" />;
};

function formatType(type: string): string {
	return type
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = { alerts: DashboardAlert[] };

function courseDetailHref(courseId: string) {
	return `/courses?course=${encodeURIComponent(courseId)}`;
}

export function AlertsList({ alerts }: Props) {
	return (
		<div className="card" style={{ padding: "20px" }}>
			<div className="eyebrow" style={{ color: "var(--danger)" }}>
				Needs your attention
			</div>

			{alerts?.length === 0 ? (
				<p style={{ fontSize: 13, color: "var(--muted)" }}>
					No alerts right now.
				</p>
			) : (
				<ul
					style={{
						listStyle: "none",
						margin: 0,
						padding: 0,
						display: "flex",
						flexDirection: "column",
						gap: 8,
					}}
				>
					{alerts.map((alert) => (
						<li
							key={`${alert.type}-${alert.message}`}
							className={`alert-item ${alertClass[alert.severity]}`}
						>
							<div
								style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
							>
								<AlertIcon severity={alert.severity} />
								<div>
									<div
										style={{
											fontSize: 11.5,
											fontWeight: 600,
											color: "var(--ink-soft)",
											marginBottom: 2,
										}}
									>
										{formatType(alert.type)}
									</div>
									<div
										style={{
											fontSize: 12,
											color: "var(--ink-soft)",
											lineHeight: 1.45,
										}}
									>
										{alert.message}
									</div>
									{alert.relatedEntityId && (
										<a
											href={courseDetailHref(alert.relatedEntityId)}
											style={{
												display: "inline-block",
												marginTop: 4,
												fontSize: 11,
												fontWeight: 600,
												color: "var(--blue-600)",
												textDecoration: "none",
											}}
										>
											Resolve →
										</a>
									)}
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
