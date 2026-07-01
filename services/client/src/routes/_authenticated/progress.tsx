import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyUploadHero } from "#/components/progress/EmptyUploadHero";
import { ImportOverview } from "#/components/progress/ImportOverview";
import { ImportReviewLayout } from "#/components/progress/ImportReviewLayout";
import { useImportReducer } from "#/hooks/useImportReducer";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";

export const Route = createFileRoute("/_authenticated/progress")({
	component: Progress,
});

function Progress() {
	const [state, dispatch] = useImportReducer();
	const { mutate, isPending } = useTranscriptUpload();
	const [uploadError, setUploadError] = useState<string | null>(null);

	function handleFileSelected(file: File) {
		setUploadError(null);
		mutate(file, {
			onSuccess: (result) => {
				dispatch({ type: "UPLOAD_SUCCESS", result });
			},
			onError: (error) => {
				setUploadError(error?.message ?? "Upload failed. Please try again.");
			},
		});
	}

	if (state.phase === "review") {
		return <ImportReviewLayout state={state} dispatch={dispatch} />;
	}

	if (state.phase === "done") {
		return <ImportOverview state={state} dispatch={dispatch} />;
	}

	return (
		<EmptyUploadHero
			onFileSelected={handleFileSelected}
			isUploading={isPending}
			error={uploadError}
		/>
	);
}
