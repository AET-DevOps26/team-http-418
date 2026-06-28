import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addCourseToSemester,
	generateRoadmap,
	getRoadmap,
	removeCourseFromSemester,
} from "#/api/roadmap";
import type { Roadmap } from "#/api/types";

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
			const prev = queryClient.getQueryData<Roadmap>(["roadmap"]);
			if (prev) {
				queryClient.setQueryData<Roadmap>(["roadmap"], {
					...prev,
					semesters: prev.semesters.map((s) =>
						s.semesterKey === semesterKey
							? {
									...s,
									totalCredits: s.totalCredits + 5,
									courses: [
										...s.courses,
										{
											courseId,
											courseCode: "...",
											courseName: "Loading...",
											credits: 5,
											status: "PLANNED" as const,
										},
									],
								}
							: s,
					),
				});
			}
			return { prev };
		},
		onError: (_err, _vars, context) => {
			if (context?.prev) {
				queryClient.setQueryData(["roadmap"], context.prev);
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
			const prev = queryClient.getQueryData<Roadmap>(["roadmap"]);
			if (prev) {
				queryClient.setQueryData<Roadmap>(["roadmap"], {
					...prev,
					semesters: prev.semesters.map((s) =>
						s.semesterKey === semesterKey
							? {
									...s,
									totalCredits:
										s.totalCredits -
										(s.courses.find((c) => c.courseId === courseId)?.credits ??
											0),
									courses: s.courses.filter((c) => c.courseId !== courseId),
								}
							: s,
					),
				});
			}
			return { prev };
		},
		onError: (_err, _vars, context) => {
			if (context?.prev) {
				queryClient.setQueryData(["roadmap"], context.prev);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["roadmap"] });
		},
	});
}
