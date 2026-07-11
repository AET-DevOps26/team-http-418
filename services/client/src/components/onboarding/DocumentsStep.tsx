import { CheckCircle, MinusCircle } from "lucide-react";
import { ImportedTable } from "#/components/progress/ImportedTable";
import { TranscriptUploader } from "#/components/progress/TranscriptUploader";
import { UnmatchedTable } from "#/components/progress/UnmatchedTable";
import { useImportReducer } from "#/hooks/useImportReducer";
import type { OnboardingStep2 } from "#/hooks/useOnboarding";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";

type Props = {
	onUpdate: (data: Partial<OnboardingStep2>) => void;
	onNext: () => void;
	onSkip: () => void;
};

export function DocumentsStep({ onUpdate, onNext, onSkip }: Props) {
	const transcriptMutation = useTranscriptUpload();
	const [importState, importDispatch] = useImportReducer();

	function handleTranscriptFile(file: File) {
		transcriptMutation.mutate(file, {
			onSuccess: (result) => {
				importDispatch({ type: "UPLOAD_SUCCESS", result });
				onUpdate({ transcriptUploaded: true });
			},
		});
	}

	function handleNext() {
		if (importState.phase === "review") {
			importDispatch({ type: "FINISH_IMPORT" });
		}
		onNext();
	}

	function handleSkip() {
		onSkip();
	}

	function handleReupload() {
		importDispatch({ type: "RESET" });
		onUpdate({ transcriptUploaded: false });
	}

	const inReview = importState.phase === "review";
	const importDone = importState.phase === "done";

	return (
		<div>
			<div style={{ marginBottom: 20 }}>
				<h2
					style={{
						margin: "0 0 4px",
						fontSize: 18,
						fontWeight: 700,
						color: "#0B1F33",
					}}
				>
					Upload Documents
				</h2>
				<p style={{ margin: 0, fontSize: 14, color: "#6E7E94" }}>
					Import your academic history and experience. Both are optional — you
					can skip.
				</p>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
				<div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginBottom: 10,
						}}
					>
						<span style={{ fontSize: 13, fontWeight: 600, color: "#0B1F33" }}>
							Grade Report / Transcript
						</span>
						{(inReview || importDone) && (
							<CheckCircle size={15} style={{ color: "#2D6FB5" }} />
						)}
					</div>

					{inReview ? (
						<TranscriptReview state={importState} onReupload={handleReupload} />
					) : importDone ? (
						<TranscriptDone
							count={importState.imported.length}
							onReupload={handleReupload}
						/>
					) : (
						<>
							<TranscriptUploader
								onFileSelected={handleTranscriptFile}
								isUploading={transcriptMutation.isPending}
							/>
							{transcriptMutation.isError && (
								<p
									style={{
										color: "var(--danger)",
										fontSize: 12.5,
										marginTop: 6,
									}}
								>
									Upload failed. Please try again.
								</p>
							)}
						</>
					)}
				</div>

			</div>

			<div
				style={{
					display: "flex",
					gap: 10,
					justifyContent: "flex-end",
					marginTop: 24,
				}}
			>
				<button
					type="button"
					onClick={handleSkip}
					style={{
						padding: "9px 18px",
						fontSize: 14,
						fontWeight: 500,
						color: "#6E7E94",
						background: "none",
						border: "1px solid #E2E7EF",
						borderRadius: 10,
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					Skip
				</button>
				<button
					type="button"
					onClick={handleNext}
					style={{
						padding: "9px 22px",
						fontSize: 14,
						fontWeight: 600,
						color: "#fff",
						background: "linear-gradient(135deg, #8A57E0, #2D6FB5)",
						border: "none",
						borderRadius: 10,
						cursor: "pointer",
						boxShadow: "0 4px 14px rgba(138,87,224,0.3)",
						fontFamily: "inherit",
					}}
				>
					Next →
				</button>
			</div>
		</div>
	);
}

function TranscriptReview({
	state,
	onReupload,
}: {
	state: ReturnType<typeof useImportReducer>[0];
	onReupload: () => void;
}) {
	const activeUnmatched = state.unmatched.filter((u) => !u.skipped);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
			<div className="import-summary">
				<span className="import-stat import-stat--success">
					<CheckCircle size={15} strokeWidth={1.75} />
					{state.imported.length} imported
				</span>
				<span className="import-stat import-stat--muted">
					<MinusCircle size={15} strokeWidth={1.75} />
					{state.unmatched.length} unmatched
				</span>
			</div>

			{state.generalErrors.length > 0 && (
				<div className="alert-item alert-error">
					<ul
						style={{
							margin: 0,
							paddingLeft: 18,
							fontSize: 12.5,
							color: "var(--ink-soft)",
						}}
					>
						{state.generalErrors.map((e) => (
							<li key={e}>{e}</li>
						))}
					</ul>
				</div>
			)}

			{state.imported.length > 0 && (
				<div style={{ overflowX: "auto" }}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							color: "var(--muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: 6,
						}}
					>
						Imported Courses
					</div>
					<ImportedTable imported={state.imported} />
				</div>
			)}

			{state.unmatched.length > 0 && (
				<div style={{ overflowX: "auto" }}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 600,
							color: "var(--muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: 6,
						}}
					>
						Unmatched Courses
					</div>
					<UnmatchedTable unmatched={state.unmatched} />
				</div>
			)}

			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<button
					type="button"
					onClick={onReupload}
					style={{
						padding: 0,
						fontSize: 12.5,
						color: "#6E7E94",
						background: "none",
						border: "none",
						textDecoration: "underline",
						cursor: "pointer",
						fontFamily: "inherit",
					}}
				>
					Upload different file
				</button>
				{activeUnmatched.length > 0 && (
					<span style={{ fontSize: 12, color: "var(--muted)" }}>
						{activeUnmatched.length} still unresolved
					</span>
				)}
			</div>
		</div>
	);
}

function TranscriptDone({
	count,
	onReupload,
}: {
	count: number;
	onReupload: () => void;
}) {
	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 10,
					padding: "14px 16px",
					background: "rgba(45,111,181,0.06)",
					border: "1px solid rgba(45,111,181,0.2)",
					borderRadius: 10,
				}}
			>
				<CheckCircle size={20} style={{ color: "#2D6FB5", flexShrink: 0 }} />
				<span style={{ fontSize: 14, color: "#0B1F33", fontWeight: 500 }}>
					{count} course{count !== 1 ? "s" : ""} imported successfully
				</span>
			</div>
			<button
				type="button"
				onClick={onReupload}
				style={{
					marginTop: 8,
					padding: 0,
					fontSize: 12.5,
					color: "#6E7E94",
					background: "none",
					border: "none",
					textDecoration: "underline",
					cursor: "pointer",
					fontFamily: "inherit",
				}}
			>
				Upload different transcript
			</button>
		</div>
	);
}
