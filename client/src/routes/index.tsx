import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const { data: message, error } = useQuery({
		queryKey: ["hello"],
		queryFn: () =>
			fetch("/api/hello").then((res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.text();
			}),
	});

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Welcome to Team HTTP 418</h1>
			<p className="mt-4 text-lg">
				{error ? (
					<span className="text-red-500">Server error: {error.message}</span>
				) : message ? (
					message
				) : (
					"Loading..."
				)}
			</p>
		</div>
	);
}
