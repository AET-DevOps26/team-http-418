export function GeneratingState() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 16,
				padding: 60,
			}}
		>
			<div className="generating-spinner" />
			<p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
				AI is generating your roadmap…
			</p>
		</div>
	);
}
