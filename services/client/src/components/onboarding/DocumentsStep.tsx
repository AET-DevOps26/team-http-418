import { CheckCircle } from "lucide-react";
import type { CvData } from "#/api/types";
import { TranscriptUploader } from "#/components/progress/TranscriptUploader";
import type { OnboardingStep2 } from "#/hooks/useOnboarding";
import { useTranscriptUpload } from "#/hooks/useTranscriptUpload";
import { CvUploader } from "./CvUploader";

type Props = {
	data: OnboardingStep2 | null;
	onUpdate: (data: Partial<OnboardingStep2>) => void;
	onNext: () => void;
	onSkip: () => void;
};

export function DocumentsStep({ data, onUpdate, onNext, onSkip }: Props) {
	const transcriptMutation = useTranscriptUpload();

	function handleTranscriptFile(file: File) {
		transcriptMutation.mutate(file, {
			onSuccess: () => onUpdate({ transcriptUploaded: true }),
		});
	}

	function handleCvUploaded(cvData: CvData) {
		onUpdate({ cvUploaded: true, cvData });
	}

	const transcriptDone = data?.transcriptUploaded ?? false;
	const cvDone = data?.cvUploaded ?? false;

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
						{transcriptDone && (
							<CheckCircle size={15} style={{ color: "#2D6FB5" }} />
						)}
					</div>
					{transcriptDone ? (
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
							<CheckCircle
								size={20}
								style={{ color: "#2D6FB5", flexShrink: 0 }}
							/>
							<span style={{ fontSize: 14, color: "#0B1F33", fontWeight: 500 }}>
								Transcript uploaded successfully
							</span>
						</div>
					) : (
						<TranscriptUploader
							onFileSelected={handleTranscriptFile}
							isUploading={transcriptMutation.isPending}
						/>
					)}
					{transcriptMutation.isError && (
						<p style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 6 }}>
							Upload failed. Please try again.
						</p>
					)}
				</div>

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
							CV / Résumé
						</span>
						{cvDone && <CheckCircle size={15} style={{ color: "#2D6FB5" }} />}
					</div>
					<CvUploader onUploaded={handleCvUploaded} uploaded={cvDone} />
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
					onClick={onSkip}
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
					onClick={onNext}
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
