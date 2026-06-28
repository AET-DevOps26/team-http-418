import { useDepartments } from "#/hooks/useDepartments";
import { useStudyPrograms } from "#/hooks/useStudyPrograms";
import type { CourseSearchParams } from "#/api/types";

type Filters = Pick<
	CourseSearchParams,
	"department" | "studyProgramId" | "language" | "level" | "creditsMin" | "creditsMax" | "semester"
>;

type Props = {
	filters: Filters;
	onChange: (filters: Filters) => void;
};

export function FilterPanel({ filters, onChange }: Props) {
	const { data: departments } = useDepartments();
	const { data: studyPrograms } = useStudyPrograms(filters.department);

	function set<K extends keyof Filters>(key: K, value: Filters[K]) {
		const next = { ...filters, [key]: value };
		if (key === "department") next.studyProgramId = undefined;
		onChange(next);
	}

	function clear() {
		onChange({});
	}

	const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

	return (
		<div className="catalog-filter-panel">
			<select
				className="catalog-filter-select"
				value={filters.department ?? ""}
				onChange={(e) => set("department", e.target.value || undefined)}
			>
				<option value="">All departments</option>
				{departments?.map((d) => (
					<option key={d.id} value={d.id}>
						{d.name}
					</option>
				))}
			</select>

			<select
				className="catalog-filter-select"
				value={filters.studyProgramId ?? ""}
				onChange={(e) => set("studyProgramId", e.target.value || undefined)}
				disabled={!filters.department}
			>
				<option value="">All programs</option>
				{studyPrograms?.map((p) => (
					<option key={p.id} value={p.id}>
						{p.name}
					</option>
				))}
			</select>

			<select
				className="catalog-filter-select"
				value={filters.language ?? ""}
				onChange={(e) => set("language", e.target.value || undefined)}
			>
				<option value="">Any language</option>
				<option value="EN">English</option>
				<option value="DE">German</option>
			</select>

			<select
				className="catalog-filter-select"
				value={filters.level ?? ""}
				onChange={(e) => set("level", e.target.value || undefined)}
			>
				<option value="">Any level</option>
				<option value="BACHELOR">Bachelor</option>
				<option value="MASTER">Master</option>
			</select>

			<select
				className="catalog-filter-select"
				value={filters.semester ?? ""}
				onChange={(e) => set("semester", e.target.value || undefined)}
			>
				<option value="">Any semester</option>
				<option value="WS">Winter</option>
				<option value="SS">Summer</option>
			</select>

			<div className="catalog-filter-credits">
				<input
					className="catalog-filter-credit-input"
					type="number"
					min={0}
					placeholder="Min ECTS"
					value={filters.creditsMin ?? ""}
					onChange={(e) =>
						set("creditsMin", e.target.value ? Number(e.target.value) : undefined)
					}
				/>
				<span style={{ color: "var(--muted)", fontSize: 12 }}>–</span>
				<input
					className="catalog-filter-credit-input"
					type="number"
					min={0}
					placeholder="Max ECTS"
					value={filters.creditsMax ?? ""}
					onChange={(e) =>
						set("creditsMax", e.target.value ? Number(e.target.value) : undefined)
					}
				/>
			</div>

			{hasFilters && (
				<button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={clear}>
					Clear filters
				</button>
			)}
		</div>
	);
}
