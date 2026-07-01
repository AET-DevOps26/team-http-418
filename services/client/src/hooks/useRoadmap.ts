import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addCourseToSemester,
	generateRoadmap,
	getRoadmap,
	removeCourseFromSemester,
} from "#/api/roadmap";
import type { Roadmap, SemesterPlanDetail } from "#/api/types";

export function useRoadmap() {
	return useQuery({
		queryKey: ["roadmap"],
		queryFn: getRoadmap,
		refetchInterval: (query) =>
			query.state.data?.status === "GENERATING" ? 3000 : false,
	});
}

export function useGenerateRoadmap() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: generateRoadmap,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roadmap"] });
		},
	});
}

export function useSemester(key: string) {
	return useQuery({
		queryKey: ["roadmap", "semesters", key],
		queryFn: () => import("#/api/roadmap").then((m) => m.getSemester(key)),
	});
}

export function useAddCourseToSemester() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			semesterKey,
			courseId,
		}: {
			semesterKey: string;
			courseId: string;
		}) => addCourseToSemester(semesterKey, { courseId }),
		onMutate: async ({ semesterKey, courseId }) => {
			await queryClient.cancelQueries({ queryKey: ["roadmap"] });
			const prevRoadmap = queryClient.getQueryData<Roadmap>(["roadmap"]);
			const prevSemesters = queryClient.getQueryData<SemesterPlanDetail[]>([
				"roadmap",
				"semesters",
			]);
			const prevSemester = queryClient.getQueryData<SemesterPlanDetail>([
				"roadmap",
				"semesters",
				semesterKey,
			]);
			const optimisticCourse = {
				courseId,
				courseCode: courseId.toUpperCase(),
				courseName: "Loading...",
				credits: 5,
				status: "PLANNED" as const,
			};
			const updateSemester = (semester: SemesterPlanDetail) =>
				semester.semesterKey === semesterKey
					? {
							...semester,
							totalCredits: semester.totalCredits + optimisticCourse.credits,
							courses: [...semester.courses, optimisticCourse],
						}
					: semester;

			queryClient.setQueryData<Roadmap>(["roadmap"], (prev) => {
				if (
					!prev ||
					!prev.semesters.some((s) => s.semesterKey === semesterKey)
				) {
					return prev;
				}
				return {
					...prev,
					totalPlannedCredits:
						prev.totalPlannedCredits + optimisticCourse.credits,
					semesters: prev.semesters.map(updateSemester),
				};
			});
			queryClient.setQueryData<SemesterPlanDetail[]>(
				["roadmap", "semesters"],
				(prev) => prev?.map(updateSemester),
			);
			queryClient.setQueryData<SemesterPlanDetail>(
				["roadmap", "semesters", semesterKey],
				(prev) => (prev ? updateSemester(prev) : prev),
			);
			return { prevRoadmap, prevSemesters, prevSemester };
		},
		onError: (_err, _vars, context) => {
			if (context?.prevRoadmap) {
				queryClient.setQueryData(["roadmap"], context.prevRoadmap);
			}
			if (context?.prevSemesters) {
				queryClient.setQueryData(
					["roadmap", "semesters"],
					context.prevSemesters,
				);
			}
			if (context?.prevSemester) {
				queryClient.setQueryData(
					["roadmap", "semesters", context.prevSemester.semesterKey],
					context.prevSemester,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["roadmap"] });
		},
	});
}

export function useRemoveCourseFromSemester() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			semesterKey,
			courseId,
		}: {
			semesterKey: string;
			courseId: string;
		}) => removeCourseFromSemester(semesterKey, courseId),
		onMutate: async ({ semesterKey, courseId }) => {
			await queryClient.cancelQueries({ queryKey: ["roadmap"] });
			const prevRoadmap = queryClient.getQueryData<Roadmap>(["roadmap"]);
			const prevSemesters = queryClient.getQueryData<SemesterPlanDetail[]>([
				"roadmap",
				"semesters",
			]);
			const prevSemester = queryClient.getQueryData<SemesterPlanDetail>([
				"roadmap",
				"semesters",
				semesterKey,
			]);
			const cachedSemesters =
				prevRoadmap?.semesters ??
				prevSemesters ??
				(prevSemester ? [prevSemester] : []);
			const removedCredits =
				cachedSemesters
					.find((s) => s.semesterKey === semesterKey)
					?.courses.find((c) => c.courseId === courseId)?.credits ?? 0;
			const updateSemester = (semester: SemesterPlanDetail) =>
				semester.semesterKey === semesterKey
					? {
							...semester,
							totalCredits: semester.totalCredits - removedCredits,
							courses: semester.courses.filter((c) => c.courseId !== courseId),
						}
					: semester;

			queryClient.setQueryData<Roadmap>(["roadmap"], (prev) => {
				if (!prev || removedCredits === 0) return prev;
				return {
					...prev,
					totalPlannedCredits: prev.totalPlannedCredits - removedCredits,
					semesters: prev.semesters.map(updateSemester),
				};
			});
			queryClient.setQueryData<SemesterPlanDetail[]>(
				["roadmap", "semesters"],
				(prev) => prev?.map(updateSemester),
			);
			queryClient.setQueryData<SemesterPlanDetail>(
				["roadmap", "semesters", semesterKey],
				(prev) => (prev ? updateSemester(prev) : prev),
			);
			return { prevRoadmap, prevSemesters, prevSemester };
		},
		onError: (_err, _vars, context) => {
			if (context?.prevRoadmap) {
				queryClient.setQueryData(["roadmap"], context.prevRoadmap);
			}
			if (context?.prevSemesters) {
				queryClient.setQueryData(
					["roadmap", "semesters"],
					context.prevSemesters,
				);
			}
			if (context?.prevSemester) {
				queryClient.setQueryData(
					["roadmap", "semesters", context.prevSemester.semesterKey],
					context.prevSemester,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["roadmap"] });
		},
	});
}
