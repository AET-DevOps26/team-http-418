import type { DashboardRecommendation } from "#/api/types";

type Props = { recommendations: DashboardRecommendation[] };

export function RecommendationPreview({ recommendations }: Props) {
	const top3 = recommendations.slice(0, 3);

	return (
		<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
			<h2 className="text-lg font-semibold text-gray-900 mb-4">
				Recommended Courses
			</h2>
			{top3.length === 0 ? (
				<p className="text-sm text-gray-500">No recommendations available.</p>
			) : (
				<ul className="space-y-3">
					{top3.map((rec) => (
						<li key={rec.courseId}>
							<a
								href={`/courses/${rec.courseId}`}
								className="block rounded-xl border border-gray-100 p-4 hover:border-purple-200 hover:bg-purple-50 transition-colors"
							>
								<div className="flex items-start justify-between gap-2">
									<div className="flex items-center gap-2">
										<span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
											{rec.courseCode}
										</span>
										<span className="text-sm font-medium text-gray-900">
											{rec.courseName}
										</span>
									</div>
									<span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
										{Math.round(rec.relevanceScore * 100)}%
									</span>
								</div>
								<p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
									{rec.reason}
								</p>
							</a>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
