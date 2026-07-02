import { CheckCircle, Loader2, Upload } from "lucide-react";
import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import type { CvData } from "#/api/types";
import { useCvUpload } from "#/hooks/useCvUpload";

type Props = {
	onUploaded: (cvData: CvData) => void;
	uploaded: boolean;
};

const MAX_SIZE = 10 * 1024 * 1024;

export function CvUploader({ onUploaded, uploaded }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const dragCounter = useRef(0);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const mutation = useCvUpload();

	function handleFile(file: File) {
		const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
		if (ext !== ".pdf") {
			setError("Only PDF files are supported.");
			return;
		}
		if (file.size > MAX_SIZE) {
			setError("File must be under 10 MB.");
			return;
		}
		setError(null);
		mutation.mutate(file, {
			onSuccess: (cvData) => onUploaded(cvData),
			onError: () => setError("CV upload failed. Please try again."),
		});
	}

	function onDragEnter(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		dragCounter.current++;
		setDragActive(true);
	}
	function onDragOver(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
	}
	function onDragLeave(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		dragCounter.current--;
		if (dragCounter.current === 0) setDragActive(false);
	}
	function onDrop(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		dragCounter.current = 0;
		setDragActive(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}
	function onChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		e.target.value = "";
	}

	const isUploading = mutation.isPending;

	if (uploaded) {
		return (
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
					CV uploaded and parsed successfully
				</span>
			</div>
		);
	}

	return (
		<div>
			<button
				type="button"
				className={["drop-zone", dragActive ? "drop-zone--active" : "", isUploading ? "drop-zone--disabled" : ""].filter(Boolean).join(" ")}
				onDragEnter={onDragEnter}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				onClick={() => !isUploading && inputRef.current?.click()}
				disabled={isUploading}
				aria-busy={isUploading}
			>
				{isUploading ? (
					<Loader2
						size={28}
						strokeWidth={1.5}
						style={{ color: "var(--blue-500)", margin: "0 auto 10px", animation: "spin 1s linear infinite" }}
					/>
				) : (
					<Upload size={28} strokeWidth={1.5} style={{ color: "var(--muted)", margin: "0 auto 10px" }} />
				)}
				<span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
					{isUploading ? "Parsing CV…" : "Upload your CV / Résumé"}
				</span>
				<span style={{ display: "block", margin: "4px 0 10px", fontSize: 12.5, color: "var(--muted)" }}>
					PDF, up to 10 MB
				</span>
				{!isUploading && <span className="btn btn-ghost" aria-hidden="true">Browse</span>}
			</button>
			<input ref={inputRef} type="file" accept=".pdf" onChange={onChange} style={{ display: "none" }} />
			{error && (
				<p style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}>{error}</p>
			)}
		</div>
	);
}
