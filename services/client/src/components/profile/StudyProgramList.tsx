import type { StudyProgramRef } from "#/api/types";

export function StudyProgramList({
	programs,
}: {
	programs: StudyProgramRef[];
}) {
	return (
		<div className="card" style={{ padding: 24 }}>
			<p className="eyebrow">Study Programs</p>
			<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
				{programs.map((p) => (
					<div
						key={p.id}
						style={{
							padding: "10px 14px",
							borderRadius: "var(--r-md)",
							border: "1px solid var(--line)",
							background: "var(--canvas)",
						}}
					>
						<div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
							{p.name}
						</div>
						<div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
							{p.nameGer}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
