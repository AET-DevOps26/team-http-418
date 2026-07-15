import { useProfile } from "#/hooks/useProfile";
import {
	useEnrolledCourses,
	useProgress,
	useRequirements,
} from "#/hooks/useProgress";
import { useRecommendations } from "#/hooks/useRecommendations";

export function useDashboardData() {
	const profileQuery = useProfile();
	const progressQuery = useProgress();
	const enrolledCoursesQuery = useEnrolledCourses(0, 100);
	const recommendationsQuery = useRecommendations({ limit: 3 });
	const requirementsQuery = useRequirements();

	const profile = profileQuery.data;
	const progress = progressQuery.data;
	const enrolledCourses = enrolledCoursesQuery.data?.content ?? [];
	const recommendations = recommendationsQuery.data;
	const requirements = requirementsQuery.data;

	const isLoading =
		profileQuery.isLoading ||
		progressQuery.isLoading ||
		enrolledCoursesQuery.isLoading;

	const hasStudyProgram = !!profile?.student?.studyProgramId;
	const hasTranscript =
		(progress?.totalCreditsEarned ?? 0) > 0 ||
		(progress?.completedCourseCount ?? 0) > 0;
	const hasEnrolledCourses =
		enrolledCourses.length > 0 || (progress?.enrolledCourseCount ?? 0) > 0;
	const hasGoalsOrInterests =
		(profile?.student?.interests?.length ?? 0) > 0 ||
		(profile?.student?.careerGoals?.length ?? 0) > 0;
	const hasRecommendations =
		(recommendations?.recommendations?.length ?? 0) > 0;
	const hasRequirements = (requirements?.categories?.length ?? 0) > 0;

	const creditsRequired = profile?.student?.creditsRequired ?? 0;
	const currentSemester =
		profile?.semesterKey ?? progress?.currentSemester ?? "";
	const progressPercentage =
		creditsRequired > 0
			? ((progress?.totalCreditsEarned ?? 0) / creditsRequired) * 100
			: (progress?.progressPercentage ?? 0);
	const dashboardProgress = progress
		? {
				...progress,
				totalCreditsRequired: creditsRequired,
				currentSemester,
				progressPercentage,
			}
		: undefined;

	return {
		profileQuery,
		progressQuery,
		enrolledCoursesQuery,
		recommendationsQuery,
		requirementsQuery,
		profile,
		progress: dashboardProgress,
		enrolledCourses,
		recommendations,
		requirements,
		isLoading,
		hasStudyProgram,
		hasTranscript,
		hasEnrolledCourses,
		hasGoalsOrInterests,
		hasRecommendations,
		hasRequirements,
		creditsRequired,
		currentSemester,
		progressPercentage,
	};
}
