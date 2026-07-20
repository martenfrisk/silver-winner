// Generates static MP3 pronunciation files for every Burmese string in the
// course using Microsoft Edge's neural TTS (voice: my-MM-NilarNeural).
//
// Usage:
//   pip install edge-tts        (or point EDGE_TTS at the binary)
//   bun run audio
//
// Output: static/audio/<hash>.mp3 + src/lib/audio-manifest.json
import { course } from '../src/lib/data/course';
import { allAudioSyllables, decodableSentences, decodableWords, glyphs, loanWords } from '../src/lib/data/script';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EDGE_TTS = process.env.EDGE_TTS ?? 'edge-tts';
const VOICE = process.env.TTS_VOICE ?? 'my-MM-NilarNeural';
const outDir = join(import.meta.dir, '../static/audio');
const manifestPath = join(import.meta.dir, '../src/lib/audio-manifest.json');

/** djb2 — stable tiny hash for filenames. */
function hash(s: string): string {
	let h = 5381;
	for (const c of s) h = (h * 33) ^ c.codePointAt(0)!;
	return (h >>> 0).toString(16).padStart(8, '0');
}

// Collect every string that the app can speak.
const texts = new Set<string>();
for (const unit of course) {
	for (const lesson of unit.lessons) {
		for (const ex of lesson.exercises) {
			if (ex.kind === 'learn') texts.add(ex.my);
			else if (ex.kind === 'choice' && ex.promptMy) texts.add(ex.promptMy);
			else if (ex.kind === 'match') for (const p of ex.pairs) texts.add(p.l);
			else if (ex.kind === 'assemble') texts.add(ex.my);
			else if (ex.kind === 'listen') texts.add(ex.my);
		}
	}
}
// Script Studio: glyph names, buildable syllables, decodable words + sentences.
for (const g of glyphs) texts.add(g.speak);
for (const s of allAudioSyllables()) texts.add(s.text);
for (const words of Object.values(decodableWords)) for (const w of words) texts.add(w.my);
for (const sentences of Object.values(decodableSentences)) for (const s of sentences) texts.add(s.my);
for (const w of loanWords) texts.add(w.my);

mkdirSync(outDir, { recursive: true });

const entries = [...texts].map((text) => ({ text, file: `audio/${hash(text)}.mp3` }));
const todo = entries.filter((e) => !existsSync(join(outDir, `${hash(e.text)}.mp3`)));
console.log(`${texts.size} strings, ${todo.length} to generate (voice: ${VOICE})`);

let failed = 0;
const CONCURRENCY = 4;
for (let i = 0; i < todo.length; i += CONCURRENCY) {
	const batch = todo.slice(i, i + CONCURRENCY);
	await Promise.all(
		batch.map(async ({ text }) => {
			const dest = join(outDir, `${hash(text)}.mp3`);
			const proc = Bun.spawn(
				[EDGE_TTS, '--voice', VOICE, '--text', text, '--write-media', dest],
				{ stdout: 'ignore', stderr: 'pipe' }
			);
			const code = await proc.exited;
			if (code !== 0) {
				failed++;
				console.error(`FAILED: ${text}\n${await new Response(proc.stderr).text()}`);
			} else {
				console.log(`ok: ${text}`);
			}
		})
	);
}

if (failed > 0) {
	console.error(`\n${failed} file(s) failed — manifest not written. Re-run to retry.`);
	process.exit(1);
}

const manifest = Object.fromEntries(entries.map((e) => [e.text, e.file]));
writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
console.log(`\nWrote ${entries.length} entries to src/lib/audio-manifest.json`);
