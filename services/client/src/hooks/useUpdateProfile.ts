import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "#/api/profile";
import type { StudentProfile } from "#/api/types";

export function useUpdateProfile() {
	const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (fullProfile: StudentProfile) => updateProfile(fullProfile),

        onSuccess: (updatedProfile) => {
            // 2. Update the local cache with the new full profile data
            queryClient.setQueryData(["profile"], updatedProfile);

            // 3. Invalidate to ensure sync with the server
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });
}
