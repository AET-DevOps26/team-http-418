import { AlertTriangle, CheckCircle, MinusCircle } from "lucide-react";
import type {
	ImportError,
	ImportedCourse,
	TranscriptImportResult,
} from "#/api/types";

type Props = {
	result: TranscriptImportResult;
};

function formatImportError(error: ImportError): string {
	if (typeof error === "string") return error;
	return `${error.row != null ? `Row ${error.row}: ` : ""}${error.message}`;
}

function getCourseCode(course: ImportedCourse): string {
	return course?.courseCode ?? course?.moduleId ?? "Unknown";
}

function getCourseName(course: ImportedCourse): string {
	return (
		course.courseName ?? course.titleEn ?? course.titleDe ?? "Unknown course"
	);
}

export function ImportResultPanel({ result }: Props) {
	const showGrade = result.importedCourses.some((course) => course.grade);

	return (
		<div className="card" style={{ padding: 20 }}>
			<div className="eyebrow">Import Result</div>

			<div className="import-summary">
				<span className="import-stat import-stat--success">
					<CheckCircle size={15} strokeWidth={1.75} />
					{result.importedCount} imported
				</span>
				<span className="import-stat import-stat--muted">
					<MinusCircle size={15} strokeWidth={1.75} />
					{result.skippedCount} skipped
				</span>
			</div>

			{result.errors.length > 0 && (
				<div className="alert-item alert-error" style={{ marginBottom: 16 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							marginBottom: 4,
							fontWeight: 500,
							fontSize: 13,
						}}
					>
						<AlertTriangle size={14} strokeWidth={2} />
						{result.errors.length} error
						{result.errors.length > 1 ? "s" : ""}
					</div>
					<ul
						style={{
							margin: 0,
							paddingLeft: 18,
							fontSize: 12.5,
							color: "var(--ink-soft)",
						}}
					>
						{result.errors.map((err) => (
							<li key={formatImportError(err)}>{formatImportError(err)}</li>
						))}
					</ul>
				</div>
			)}

			{result.importedCourses.length > 0 && (
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						fontSize: 13,
					}}
				>
					<thead>
						<tr
							style={{
								borderBottom: "1px solid var(--line)",
								textAlign: "left",
								color: "var(--muted)",
								fontSize: 11.5,
								fontWeight: 600,
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							<th style={{ padding: "6px 8px" }}>Module</th>
							<th style={{ padding: "6px 8px" }}>Course</th>
							{showGrade && <th style={{ padding: "6px 8px" }}>Grade</th>}
							<th style={{ padding: "6px 8px", textAlign: "right" }}>
								Credits
							</th>
						</tr>
					</thead>
					<tbody>
						{result.importedCourses.map((c) => (
							<tr
								key={`${getCourseCode(c)}-${getCourseName(c)}`}
								style={{ borderBottom: "1px solid var(--line-soft)" }}
							>
								<td
									style={{
										padding: "8px",
										fontFamily: "var(--font-mono)",
										fontSize: 12,
									}}
								>
									{getCourseCode(c)}
								</td>
								<td style={{ padding: "8px" }}>{getCourseName(c)}</td>
								{showGrade && <td style={{ padding: "8px" }}>{c.grade}</td>}
								<td style={{ padding: "8px", textAlign: "right" }}>
									{c.credits}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
