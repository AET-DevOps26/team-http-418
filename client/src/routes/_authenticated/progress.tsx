import { createFileRoute } from "@tanstack/react-router";
import { ImportResultPanel } from "#/components/progress/ImportResultPanel";
import { TranscriptUploader } from "#/components/progress/TranscriptUploader";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";

export const Route = createFileRoute("/_authenticated/progress")({
	component: Progress,
});

function Progress() {
	const { mutate, data, isPending, isError, error } = useTranscriptUpload();

	return (
		<div className="view-fade" style={{ padding: "28px 28px 40px" }}>
			<div style={{ marginBottom: 24 }}>
				<h1
					style={{
						margin: 0,
						fontSize: 24,
						fontWeight: 700,
						color: "var(--ink)",
						lineHeight: 1.2,
					}}
				>
					Transcript Upload
				</h1>
				<p
					style={{
						margin: "4px 0 0",
						fontSize: 14,
						color: "var(--muted)",
					}}
				>
					Import completed courses from a PDF or CSV transcript
				</p>
			</div>

			<div style={{ maxWidth: 640 }}>
				<TranscriptUploader
					onFileSelected={(file) => mutate(file)}
					isUploading={isPending}
				/>

				{isError && (
					<div
						className="alert-item alert-error"
						style={{ marginTop: 16 }}
					>
						<p style={{ margin: 0, fontSize: 13 }}>
							{error?.message ?? "Upload failed. Please try again."}
						</p>
					</div>
				)}

				{data && (
					<div style={{ marginTop: 20 }}>
						<ImportResultPanel result={data} />
					</div>
				)}
			</div>
		</div>
	);
}
