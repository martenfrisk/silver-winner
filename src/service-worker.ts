/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Offline support: precache the app shell (build assets + small static
// files), runtime-cache audio clips as they're played, and serve navigations
// network-first with a cache fallback so the app opens offline after the
// first visit. SvelteKit registers this only in production builds.
const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, prerendered, version } from '$service-worker';
import { shellPages } from '$lib/shell-pages';

const CACHE = `myanlingo-${version}`;

// Everything except the audio library (3.6MB is too rude to force up front —
// clips are cached lazily as they're played).
const precache = [
	...build,
	...prerendered,
	...files.filter((f) => !f.startsWith('/audio/'))
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...precache, ...shellPages]))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);

	// Navigations: network first, then cache, then the shell.
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((res) => {
					const copy = res.clone();
					caches.open(CACHE).then((cache) => cache.put(request, copy));
					return res;
				})
				.catch(async () => (await caches.match(request)) ?? (await caches.match('/')) ?? Response.error())
		);
		return;
	}

	// Audio and app assets: cache first (all immutable in practice). Fonts are
	// self-hosted now, so they arrive as hashed build assets and are already
	// covered by `precache` — no cross-origin case left to handle.
	if (url.origin !== sw.location.origin) return;
	if (!url.pathname.startsWith('/audio/') && !precache.includes(url.pathname)) return;

	event.respondWith(
		caches.match(request).then(
			(hit) =>
				hit ??
				fetch(request).then((res) => {
					if (res.ok || res.type === 'opaque') {
						const copy = res.clone();
						caches.open(CACHE).then((cache) => cache.put(request, copy));
					}
					return res;
				})
		)
	);
});
