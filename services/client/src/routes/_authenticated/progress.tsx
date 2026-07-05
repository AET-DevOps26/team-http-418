import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EmptyUploadHero } from "#/components/progress/EmptyUploadHero";
import { ImportOverview } from "#/components/progress/ImportOverview";
import { ImportReviewLayout } from "#/components/progress/ImportReviewLayout";
import type { ImportState } from "#/hooks/useImportReducer";
import { useImportReducer } from "#/hooks/useImportReducer";
import { useCompletedCourses } from "#/hooks/useProgress";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";

export const Route = createFileRoute("/_authenticated/progress")({
	component: Progress,
});

function Progress() {
	const [state, dispatch] = useImportReducer();
	const { mutate, isPending } = useTranscriptUpload();
	const [uploadError, setUploadError] = useState<string | null>(null);
	const { data: completedPage } = useCompletedCourses(0, 1000);

	const completedState = useMemo<ImportState | null>(() => {
		if (!completedPage || completedPage.content.length === 0) return null;
		return {
			phase: "done",
			imported: completedPage.content.map((c) => ({
				rowId: 0,
				courseId: c.courseId,
				courseCode: c.courseCode,
				courseName: c.courseName,
				grade: c.grade != null ? String(c.grade) : undefined,
				credits: c.credits,
			})),
			unmatched: [],
			generalErrors: [],
		};
	}, [completedPage]);

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

	if (completedState) {
		return (
			<ImportOverview
				state={completedState}
				dispatch={dispatch}
				title="Your Courses"
				subtitle={`${completedState.imported.length} completed course${completedState.imported.length !== 1 ? "s" : ""}`}
			/>
		);
	}

	return (
		<EmptyUploadHero
			onFileSelected={handleFileSelected}
			isUploading={isPending}
			error={uploadError}
		/>
	);
}
