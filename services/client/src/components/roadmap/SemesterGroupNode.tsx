import type { Node, NodeProps } from "@xyflow/react";

type SemesterGroupData = {
	label: string;
	totalCredits: number;
	isCurrent: boolean;
};

export type SemesterGroupNodeType = Node<SemesterGroupData, "semesterGroup">;

export function SemesterGroupNode({ data }: NodeProps<SemesterGroupNodeType>) {
	const { label, totalCredits, isCurrent } = data;
	return (
		<div
			className={`rmc-semester-group${isCurrent ? " rmc-semester-group--current" : ""}`}
		>
			<p className="rmc-semester-group__label">{label}</p>
			<span className="rmc-semester-group__credits">
				{totalCredits} credits
			</span>
		</div>
	);
}
