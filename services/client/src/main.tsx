import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { hydrateAuth } from "#/api/auth";
import { queryClient } from "#/api/query-client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	scrollRestoration: true,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

async function enableMocking() {
	if (!import.meta.env.VITE_MOCK_API) return;
	const { worker } = await import("./mocks/browser");
	await worker.start({ onUnhandledRequest: "bypass" });
}

async function initApp() {
	await hydrateAuth();
	await enableMocking();

	const rootElement = document.getElementById("app");
	if (rootElement && !rootElement.innerHTML) {
		const root = ReactDOM.createRoot(rootElement);
		root.render(
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>,
		);
	}
}

initApp();
