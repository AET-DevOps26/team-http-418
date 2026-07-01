import { createFileRoute } from "@tanstack/react-router";
import { EmptyUploadHero } from "#/components/progress/EmptyUploadHero";
import { ImportOverview } from "#/components/progress/ImportOverview";
import { ImportReviewLayout } from "#/components/progress/ImportReviewLayout";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";
import { useImportReducer } from "#/hooks/useImportReducer";

export const Route = createFileRoute("/_authenticated/progress")({
	component: Progress,
});

function Progress() {
	const [state, dispatch] = useImportReducer();
	const { mutate, isPending } = useTranscriptUpload();

	function handleFileSelected(file: File) {
		mutate(file, {
			onSuccess: (result) => {
				dispatch({ type: "UPLOAD_SUCCESS", result });
			},
		});
	}

	if (state.phase === "review") {
		return <ImportReviewLayout state={state} dispatch={dispatch} />;
	}

	if (state.phase === "done") {
		return <ImportOverview state={state} dispatch={dispatch} />;
	}

	return <EmptyUploadHero onFileSelected={handleFileSelected} isUploading={isPending} />;
}
