import { Check, X } from "lucide-react";
import type { PrerequisiteNode } from "#/api/types";

type Props = {
	nodes: PrerequisiteNode[];
	metIds?: Set<string>;
	unmetIds?: Set<string>;
	showBadges?: boolean;
	depth?: number;
};

export function PrerequisiteTree({
	nodes,
	metIds,
	unmetIds,
	showBadges,
	depth = 0,
}: Props) {
	if (!nodes.length) return null;

	return (
		<ul
			className="catalog-prereq-tree"
			style={{ paddingLeft: depth === 0 ? 0 : 16 }}
		>
			{nodes.map((node) => {
				const met = metIds?.has(node.courseId);
				const unmet = unmetIds?.has(node.courseId);
				return (
					<li key={node.courseId} className="catalog-prereq-node">
						<div className="catalog-prereq-row">
							<span
								className="tag"
								style={{
									background: node.type === "REQUIRED" ? "#fef2f2" : "#fffbeb",
									color: node.type === "REQUIRED" ? "#b91c1c" : "#92400e",
									fontSize: 10,
								}}
							>
								{node.type}
							</span>
							<span style={{ fontSize: 13, color: "var(--ink)" }}>
								<span
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: 12,
										color: "var(--blue-700)",
										marginRight: 4,
									}}
								>
									{node.courseCode}
								</span>
								{node.courseName}
							</span>
							{showBadges && met && (
								<span className="catalog-prereq-badge catalog-prereq-badge--met">
									<Check size={10} strokeWidth={2.5} /> Met
								</span>
							)}
							{showBadges && unmet && (
								<span className="catalog-prereq-badge catalog-prereq-badge--unmet">
									<X size={10} strokeWidth={2.5} /> Unmet
								</span>
							)}
						</div>
						{node.prerequisites.length > 0 && (
							<PrerequisiteTree
								nodes={node.prerequisites}
								metIds={metIds}
								unmetIds={unmetIds}
								showBadges={showBadges}
								depth={depth + 1}
							/>
						)}
					</li>
				);
			})}
		</ul>
	);
}
