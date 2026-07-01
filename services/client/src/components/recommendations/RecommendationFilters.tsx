type FilterState = {
	category: string;
	semester: string;
};

type Props = {
	filters: FilterState;
	onChange: (filters: FilterState) => void;
};

const CATEGORIES = [
	{ label: "All", value: "" },
	{ label: "Core", value: "core" },
	{ label: "Electives", value: "electives" },
	{ label: "Mathematics", value: "mathematics" },
	{ label: "Application", value: "application" },
];

const SEMESTERS = [
	{ label: "Any semester", value: "" },
	{ label: "WS2025", value: "WS2025" },
	{ label: "SS2026", value: "SS2026" },
];

export function RecommendationFilters({ filters, onChange }: Props) {
	return (
		<div
			style={{
				display: "flex",
				gap: 20,
				marginBottom: 20,
				flexWrap: "wrap",
			}}
		>
			<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
				<span
					style={{
						fontSize: 11,
						fontWeight: 600,
						color: "var(--muted)",
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						marginRight: 2,
					}}
				>
					Category
				</span>
				{CATEGORIES.map(({ label, value }) => (
					<button
						key={value}
						type="button"
						className={`filter-chip${filters.category === value ? " filter-chip--active" : ""}`}
						onClick={() => onChange({ ...filters, category: value })}
					>
						{label}
					</button>
				))}
			</div>

			<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
				<span
					style={{
						fontSize: 11,
						fontWeight: 600,
						color: "var(--muted)",
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						marginRight: 2,
					}}
				>
					Semester
				</span>
				{SEMESTERS.map(({ label, value }) => (
					<button
						key={value}
						type="button"
						className={`filter-chip${filters.semester === value ? " filter-chip--active" : ""}`}
						onClick={() => onChange({ ...filters, semester: value })}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
