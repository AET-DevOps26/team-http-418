import type { Page } from "#/api/types";

type Column<T> = {
	label: string;
	render: (row: T) => React.ReactNode;
};

type Props<T> = {
	page: Page<T> | undefined;
	columns: Column<T>[];
	rowKey: (row: T) => string;
	onRemove?: (row: T) => void;
	removeLabel?: string;
	isRemoving?: boolean;
	pageNum: number;
	onPageChange: (page: number) => void;
	isLoading: boolean;
};

export function CourseTable<T>({
	page,
	columns,
	rowKey,
	onRemove,
	removeLabel = "Remove",
	isRemoving,
	pageNum,
	onPageChange,
	isLoading,
}: Props<T>) {
	if (isLoading) {
		return (
			<div style={{ padding: 20 }}>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="skel"
						style={{ height: 16, marginBottom: 12, width: `${80 - i * 10}%` }}
					/>
				))}
			</div>
		);
	}

	if (!page || page.empty) {
		return (
			<div
				style={{
					padding: 40,
					textAlign: "center",
					color: "var(--muted)",
					fontSize: 14,
				}}
			>
				No courses found.
			</div>
		);
	}

	return (
		<div style={{ overflowX: "auto" }}>
			<table className="progress-table">
				<thead>
					<tr>
						{columns.map((col) => (
							<th key={col.label}>{col.label}</th>
						))}
						{onRemove && <th />}
					</tr>
				</thead>
				<tbody>
					{page.content.map((row) => (
						<tr key={rowKey(row)}>
							{columns.map((col) => (
								<td key={col.label}>{col.render(row)}</td>
							))}
							{onRemove && (
								<td style={{ textAlign: "right" }}>
									<button
										type="button"
										className="btn btn-ghost"
										style={{ fontSize: 12, padding: "4px 10px" }}
										disabled={isRemoving}
										onClick={() => onRemove(row)}
									>
										{removeLabel}
									</button>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "12px 12px 4px",
					fontSize: 12,
					color: "var(--muted)",
				}}
			>
				<span>
					Page {page.number + 1} of {page.totalPages}
				</span>
				<div style={{ display: "flex", gap: 6 }}>
					<button
						type="button"
						className="btn btn-ghost"
						style={{ fontSize: 12, padding: "4px 10px" }}
						disabled={page.first}
						onClick={() => onPageChange(pageNum - 1)}
					>
						Prev
					</button>
					<button
						type="button"
						className="btn btn-ghost"
						style={{ fontSize: 12, padding: "4px 10px" }}
						disabled={page.last}
						onClick={() => onPageChange(pageNum + 1)}
					>
						Next
					</button>
				</div>
			</div>
		</div>
	);
}
