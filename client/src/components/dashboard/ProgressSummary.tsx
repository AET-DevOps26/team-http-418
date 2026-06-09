import type { DashboardProgress } from "#/api/types";

type Props = {
	progress: DashboardProgress;
	semesterCredits: number;
};

export function ProgressSummary({ progress, semesterCredits }: Props) {
	const { totalCreditsEarned, totalCreditsRequired, progressPercentage, gpa } =
		progress;

	return (
		<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">
				Progress Summary
			</h2>

			<div className="mb-4">
				<div className="flex justify-between text-sm text-gray-600 mb-1">
					<span>Credits Earned</span>
					<span>
						{totalCreditsEarned} / {totalCreditsRequired}
					</span>
				</div>
				<div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
				<div className="mt-1 text-right text-xs text-gray-500">
					{progressPercentage.toFixed(1)}%
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4 mt-4">
				<div className="text-center">
					<div className="text-2xl font-bold text-gray-900">
						{gpa.toFixed(2)}
					</div>
					<div className="text-xs text-gray-500 mt-0.5">GPA</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-gray-900">
						{totalCreditsEarned}
					</div>
					<div className="text-xs text-gray-500 mt-0.5">Credits Earned</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-gray-900">
						{semesterCredits}
					</div>
					<div className="text-xs text-gray-500 mt-0.5">This Semester</div>
				</div>
			</div>
		</div>
	);
}
