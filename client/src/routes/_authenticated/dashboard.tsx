import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { logout } from "#/api";
import { AlertsList } from "#/components/dashboard/AlertsList";
import { ProgressSummary } from "#/components/dashboard/ProgressSummary";
import { RecommendationPreview } from "#/components/dashboard/RecommendationPreview";
import { UpcomingClasses } from "#/components/dashboard/UpcomingClasses";
import { useDashboard } from "#/hooks/useDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

function DashboardSkeleton() {
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="mb-8 h-10 w-48 rounded-xl bg-gray-200 animate-pulse" />
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{[0, 1, 2, 3].map((i) => (
						<div
							key={i}
							className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100"
						>
							<div className="h-5 w-40 rounded bg-gray-200 animate-pulse mb-4" />
							<div className="space-y-3">
								<div className="h-4 rounded bg-gray-100 animate-pulse" />
								<div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse" />
								<div className="h-4 w-4/6 rounded bg-gray-100 animate-pulse" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function Dashboard() {
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useDashboard();

	async function handleLogout() {
		await logout();
		navigate({ to: "/login" });
	}

	if (isLoading) return <DashboardSkeleton />;

	if (isError || !data) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 mb-4">Failed to load dashboard data.</p>
					<button
						type="button"
						onClick={() => refetch()}
						className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
					>
						Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div className="flex items-center gap-3">
						<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
						<span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
							{data.progress.currentSemester}
						</span>
					</div>
					<button
						type="button"
						onClick={handleLogout}
						className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Logout
					</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<ProgressSummary
						progress={data.progress}
						semesterCredits={data.semesterCredits}
					/>
					<AlertsList alerts={data.alerts} />
					<RecommendationPreview recommendations={data.recommendations} />
					<UpcomingClasses courses={data.upcomingCourses} />
				</div>
			</div>
		</div>
	);
}
