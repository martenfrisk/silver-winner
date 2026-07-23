/// <reference types="vitest/config" />
import cloudflare from '@sveltejs/adapter-cloudflare';
import vercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The app deploys to both Vercel and Cloudflare Workers, which need different
// adapters. Both are imported statically so the dependency tree still resolves
// in one pass (see the adapter comment below); only the call is conditional.
//
// ADAPTER wins when set — that is how `wrangler deploy` builds, via the
// [build] command in wrangler.jsonc. Otherwise sniff the platform: Cloudflare
// Workers Builds sets WORKERS_CI, Pages sets CF_PAGES, and anything else
// (Vercel, a local `bun run build`) gets Vercel, the historical default.
function pickAdapter() {
	const target =
		process.env.ADAPTER ??
		(process.env.WORKERS_CI || process.env.CF_PAGES ? 'cloudflare' : 'vercel');
	if (target === 'cloudflare') return cloudflare();
	if (target === 'vercel') return vercel();
	throw new Error(`Unknown ADAPTER "${target}" — expected "cloudflare" or "vercel".`);
}

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
			adapter: pickAdapter()
		})
	]
});
