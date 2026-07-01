// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { patchProfile } from "#/api/profile";
// import type { StudentProfile } from "#/api/types";

export function useUpdateProfile() {
	// const queryClient = useQueryClient(); TODO change to use full profile update
	//
	// return useMutation({
	// 	mutationFn: (fields: Partial<StudentProfile>) => patchProfile(fields),
	// 	onSuccess: (profile) => {
	// 		queryClient.setQueryData(["profile"], profile);
	// 		queryClient.invalidateQueries({ queryKey: ["profile"] });
	// 	},
	// });
}
