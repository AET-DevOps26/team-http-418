import { useMutation } from "@tanstack/react-query";
import { uploadCv } from "#/api/profile";

export function useCvUpload() {
	return useMutation({
		mutationFn: uploadCv,
	});
}
