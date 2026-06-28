import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
	onFileSelected: (file: File) => void;
	isUploading: boolean;
};

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".csv"];

function validateFile(file: File): string | null {
	const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (!ALLOWED_EXTENSIONS.includes(ext)) {
		return "Only .pdf and .csv files are supported.";
	}
	if (file.size > MAX_SIZE) {
		return "File must be under 10 MB.";
	}
	return null;
}

export function TranscriptUploader({ onFileSelected, isUploading }: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const dragCounter = useRef(0);
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function handleFile(file: File) {
		const err = validateFile(file);
		if (err) {
			setError(err);
			return;
		}
		setError(null);
		onFileSelected(file);
	}

	function onDragEnter(e: React.DragEvent) {
		e.preventDefault();
		dragCounter.current++;
		setDragActive(true);
	}

	function onDragOver(e: React.DragEvent) {
		e.preventDefault();
	}

	function onDragLeave(e: React.DragEvent) {
		e.preventDefault();
		dragCounter.current--;
		if (dragCounter.current === 0) setDragActive(false);
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		dragCounter.current = 0;
		setDragActive(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	}

	function onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (file) handleFile(file);
		e.target.value = "";
	}

	const zoneClass = [
		"drop-zone",
		dragActive ? "drop-zone--active" : "",
		isUploading ? "drop-zone--disabled" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div>
			<div
				className={zoneClass}
				onDragEnter={onDragEnter}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				onClick={() => !isUploading && inputRef.current?.click()}
			>
				{isUploading ? (
					<Loader2
						size={32}
						strokeWidth={1.5}
						style={{
							color: "var(--blue-500)",
							margin: "0 auto 12px",
							animation: "spin 1s linear infinite",
						}}
					/>
				) : (
					<Upload
						size={32}
						strokeWidth={1.5}
						style={{ color: "var(--muted)", margin: "0 auto 12px" }}
					/>
				)}
				<p
					style={{
						margin: 0,
						fontSize: 14,
						fontWeight: 500,
						color: "var(--ink)",
					}}
				>
					{isUploading
						? "Uploading transcript…"
						: "Drag & drop your transcript here"}
				</p>
				<p
					style={{
						margin: "4px 0 12px",
						fontSize: 12.5,
						color: "var(--muted)",
					}}
				>
					PDF or CSV, up to 10 MB
				</p>
				{!isUploading && (
					<button type="button" className="btn btn-ghost">
						Browse
					</button>
				)}
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.csv"
					onChange={onChange}
					style={{ display: "none" }}
				/>
			</div>
			{error && (
				<p
					style={{
						color: "var(--danger)",
						fontSize: 12.5,
						marginTop: 8,
					}}
				>
					{error}
				</p>
			)}
		</div>
	);
}
