import { TranscriptUploader } from "#/components/progress/TranscriptUploader";

type Props = {
	onFileSelected: (file: File) => void;
	isUploading: boolean;
};

export function EmptyUploadHero({ onFileSelected, isUploading }: Props) {
	return (
		<div className="import-hero">
			<div className="import-hero-card">
				<div className="import-hero-illustration">
					<svg width="80" height="80" viewBox="0 0 80 80" fill="none">
						<rect x="8" y="16" width="64" height="52" rx="6" stroke="var(--blue-200)" strokeWidth="2" fill="var(--blue-50)" />
						<path d="M28 48 L40 36 L52 48" stroke="var(--blue-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
						<line x1="40" y1="36" x2="40" y2="56" stroke="var(--blue-400)" strokeWidth="2.5" strokeLinecap="round" />
						<rect x="20" y="12" width="40" height="8" rx="3" fill="var(--blue-100)" stroke="var(--blue-200)" strokeWidth="1.5" />
					</svg>
				</div>
				<h1
					style={{
						margin: 0,
						fontSize: 22,
						fontWeight: 700,
						color: "var(--ink)",
						lineHeight: 1.2,
						textAlign: "center",
					}}
				>
					Transcript Upload
				</h1>
				<p
					style={{
						margin: "6px 0 20px",
						fontSize: 14,
						color: "var(--muted)",
						textAlign: "center",
					}}
				>
					Import completed courses from a PDF or CSV transcript
				</p>
				<TranscriptUploader onFileSelected={onFileSelected} isUploading={isUploading} />
			</div>
		</div>
	);
}
