import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
	const [message, setMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetch("/api/hello")
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return res.text()
			})
			.then(setMessage)
			.catch((err) => setError(err.message))
	}, [])

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Welcome to Team HTTP 418</h1>
			<p className="mt-4 text-lg">
				{error ? (
					<span className="text-red-500">Server error: {error}</span>
				) : message ? (
					message
				) : (
					"Loading..."
				)}
			</p>
		</div>
	)
}
