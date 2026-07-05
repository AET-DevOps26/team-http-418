import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadTranscript } from "#/api/progress";

export function useTranscriptUpload() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: uploadTranscript,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["importState"] });
		},
	});
}
