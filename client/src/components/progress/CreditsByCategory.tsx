import type { CreditsByCategory as CategoryData } from "#/api/types";

export function CreditsByCategory({
	categories,
}: {
	categories: CategoryData[];
}) {
	return (
		<div className="card" style={{ padding: 20 }}>
			<div className="eyebrow">Credits by Category</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
				{categories.map((cat) => {
					const pct = cat.required > 0 ? (cat.earned / cat.required) * 100 : 0;
					return (
						<div key={cat.category}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 13,
									marginBottom: 6,
								}}
							>
								<span style={{ fontWeight: 500, color: "var(--ink)" }}>
									{cat.category}
								</span>
								<span style={{ color: "var(--muted)" }}>
									{cat.earned} / {cat.required}
								</span>
							</div>
							<div className="req-bar-track">
								<div
									className="req-bar-fill"
									style={{ width: `${Math.min(pct, 100)}%` }}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
