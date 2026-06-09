import type { AlertSeverity, DashboardAlert } from "#/api/types";

const severityStyles: Record<AlertSeverity, string> = {
	INFO: "bg-blue-50 border-blue-200 text-blue-800",
	WARNING: "bg-amber-50 border-amber-200 text-amber-800",
	ERROR: "bg-red-50 border-red-200 text-red-900",
};

const severityDot: Record<AlertSeverity, string> = {
	INFO: "bg-blue-400",
	WARNING: "bg-amber-400",
	ERROR: "bg-red-500",
};

function formatType(type: string): string {
	return type
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = { alerts: DashboardAlert[] };

export function AlertsList({ alerts }: Props) {
	return (
		<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
			{alerts.length === 0 ? (
				<p className="text-sm text-gray-500">No alerts right now.</p>
			) : (
				<ul className="space-y-2">
					{alerts.map((alert) => (
						<li
							key={`${alert.type}-${alert.message}`}
							className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${severityStyles[alert.severity]}`}
						>
							<span
								className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot[alert.severity]}`}
							/>
							<div>
								<span className="font-semibold">{formatType(alert.type)}</span>
								<span className="mx-1">·</span>
								<span>{alert.message}</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
