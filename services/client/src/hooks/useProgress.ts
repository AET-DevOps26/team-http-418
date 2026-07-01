import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	addCompletedCourse,
	dropCourse,
	enrollCourse,
	getCompletedCourses,
	getEnrolledCourses,
	getProgress,
	getRequirements,
	removeCompletedCourse,
} from "#/api/progress";
import type {
	AddCompletedCourseRequest,
	EnrollCourseRequest,
} from "#/api/types";

export function useProgress() {
	return useQuery({
		queryKey: ["progress"],
		queryFn: getProgress,
		staleTime: 120_000,
	});
}

export function useCompletedCourses(page: number, size: number) {
	return useQuery({
		queryKey: ["completedCourses", page, size],
		queryFn: () => getCompletedCourses(page, size),
	});
}

export function useEnrolledCourses(page: number, size: number) {
	return useQuery({
		queryKey: ["enrolledCourses", page, size],
		queryFn: () => getEnrolledCourses(page, size),
	});
}

export function useRequirements() {
	return useQuery({
		queryKey: ["requirements"],
		queryFn: getRequirements,
		staleTime: 120_000,
	});
}

const INVALIDATION_KEYS = [
	["completedCourses"],
	["progress"],
	["requirements"],
	["dashboard"],
];

export function useAddCompletedCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: AddCompletedCourseRequest) => addCompletedCourse(body),
		onSuccess: () => {
			for (const key of INVALIDATION_KEYS)
				qc.invalidateQueries({ queryKey: key });
		},
	});
}

export function useRemoveCompletedCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (courseId: string) => removeCompletedCourse(courseId),
		onSuccess: () => {
			for (const key of INVALIDATION_KEYS)
				qc.invalidateQueries({ queryKey: key });
		},
	});
}

const ENROLLED_INVALIDATION_KEYS = [
	["enrolledCourses"],
	["progress"],
	["requirements"],
	["dashboard"],
];

export function useEnrollCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body: EnrollCourseRequest) => enrollCourse(body),
		onSuccess: () => {
			for (const key of ENROLLED_INVALIDATION_KEYS)
				qc.invalidateQueries({ queryKey: key });
		},
	});
}

export function useDropCourse() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (courseId: string) => dropCourse(courseId),
		onSuccess: () => {
			for (const key of ENROLLED_INVALIDATION_KEYS)
				qc.invalidateQueries({ queryKey: key });
		},
	});
}
