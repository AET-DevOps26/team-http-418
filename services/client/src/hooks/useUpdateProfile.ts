import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchProfile } from "#/api/profile";
import type { StudentProfileUpdate } from "#/api/types";

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (fields: Partial<StudentProfileUpdate>) => patchProfile(fields),
		onSuccess: (profile) => {
			queryClient.setQueryData(["profile"], profile);
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
	});
}
