const TABS = ["Overview", "Completed", "Enrolled", "Requirements"] as const;
export type ProgressTab = (typeof TABS)[number];

export function ProgressTabs({
	active,
	onChange,
}: {
	active: ProgressTab;
	onChange: (tab: ProgressTab) => void;
}) {
	return (
		<div className="progress-tabs">
			{TABS.map((tab) => (
				<button
					key={tab}
					type="button"
					className={`progress-tab${tab === active ? " progress-tab--active" : ""}`}
					onClick={() => onChange(tab)}
				>
					{tab}
				</button>
			))}
		</div>
	);
}
