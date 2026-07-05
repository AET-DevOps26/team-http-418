import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "#/api/profile";

type ProfilePatch = {
	firstName?: string;
	lastName?: string;
	studyProgramId?: string;
	semester?: number;
	expectedGraduation?: string;
	industryPreference?: string;
	rolePreference?: string;
	preferredWorkload?: number;
	careerGoals?: string[];
	interests?: string[];
};

export function useUpdateProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (fields: ProfilePatch) => {
			const current = await getProfile();
			return updateProfile({
				...current,
				student: { ...current.student, ...fields },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
	});
}
