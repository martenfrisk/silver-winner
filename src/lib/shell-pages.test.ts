import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { shellExcluded, shellPages } from './shell-pages';

const ROUTES = join(import.meta.dirname, '../routes');

/** Every static (non-parameterized) page route on disk, as a URL path. */
function staticRoutes(dir = ROUTES, base = ''): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isFile() && entry.name === '+page.svelte') out.push(base || '/');
		if (!entry.isDirectory()) continue;
		// `[id]` segments have no finite URL set, so nothing under them can be
		// precached by name.
		if (entry.name.startsWith('[')) continue;
		out.push(...staticRoutes(join(dir, entry.name), `${base}/${entry.name}`));
	}
	return out;
}

describe('service worker shell', () => {
	it('precaches every static route, so an offline reload never 404s', () => {
		const expected = staticRoutes()
			.filter((r) => !shellExcluded.some((p) => r === p || r.startsWith(`${p}/`)))
			.sort();

		expect([...shellPages].sort()).toEqual(expected);
	});

	it('lists no route that does not exist', () => {
		const onDisk = new Set(staticRoutes());
		for (const page of shellPages) expect(onDisk).toContain(page);
	});
});
