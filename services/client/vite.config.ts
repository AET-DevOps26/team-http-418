/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	envDir: "..",
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact(),
	],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8080",
			},
			"/health": {
				target: "http://localhost:8080",
			},
		},
	},
	test: {
		environment: "jsdom",
	},
	build: {
		sourcemap: true,
	},
});

export default config;
