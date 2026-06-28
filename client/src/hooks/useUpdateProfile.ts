import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchProfile } from "#/api/profile";
import type { StudentProfileUpdate } from "#/api/types";

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (fields: Partial<StudentProfileUpdate>) => patchProfile(fields),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
	});
}
