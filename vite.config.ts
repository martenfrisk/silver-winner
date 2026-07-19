/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		// Honor the port assigned by the preview harness, if any.
		port: process.env.PORT ? Number(process.env.PORT) : 5173
	},
	test: {
		// Unit tests only — Playwright owns e2e/ via `bun run test:e2e`.
		include: ['src/**/*.test.ts'],
		environment: 'node'
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Declared explicitly rather than via adapter-auto: adapter-auto
			// installs the adapter mid-build (closeBundle), which leaves its
			// @vercel/nft dependency resolving whatever estree-walker is
			// already hoisted — vitest's 3.0.3, whose exports map has no
			// "require" condition. Declaring it here resolves the whole tree
			// in one install pass instead. See https://svelte.dev/docs/kit/adapters
			adapter: adapter()
		})
	]
});
