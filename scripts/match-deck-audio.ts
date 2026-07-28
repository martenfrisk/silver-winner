// Matches every string the app speaks against the user's own
// "Burmese - Introduction to the Script" Anki deck — their own recordings,
// not a third-party resource (see IDEAS.md Round 18). For every exact text
// match, converts the real clip and registers it in
// src/lib/human-audio-manifest.json, so the app plays the user's voice
// instead of Edge TTS wherever a recording of that exact string exists.
//
// Idempotent: strings already in the manifest are skipped, so re-running
// after the deck grows only picks up what's new.
//
// Usage:
//   bun run match:audio                report + convert every new match
//   bun run match:audio --dry-run      report only, convert nothing
//
// The deck TSV and the Anki media folder are both personal, machine-local
// paths — never committed (see .gitignore) — so this script takes them as
// arguments rather than assuming a repo-relative location.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { audioHash, DEFAULT_VOICE } from '../src/lib/voices';
import { collectSpeakables } from './speakables';

const arg = (flag: string, fallback: string) => {
	const i = process.argv.indexOf(flag);
	return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const deckPath = arg('--deck', join(import.meta.dir, '../Burmese__BScriptIntro.txt'));
const mediaDir = arg(
	'--media',
	join(process.env.HOME ?? '', 'Library/Application Support/Anki2/mollefrisk/collection.media')
);
const dryRun = process.argv.includes('--dry-run');

const outDir = join(import.meta.dir, '../static/audio-human');
const manifestPath = join(import.meta.dir, '../src/lib/human-audio-manifest.json');

if (!existsSync(deckPath)) {
	console.error(`No deck TSV at ${deckPath}\nPass --deck <path> to point at your Anki export.`);
	process.exit(1);
}
if (!existsSync(mediaDir)) {
	console.error(`No Anki media folder at ${mediaDir}\nPass --media <path> to point at collection.media.`);
	process.exit(1);
}

// ── Parse the deck: my (col 0) -> sound filename (col 2, [sound:...]) ──
// First occurrence wins per string — later rows are usually a different
// sentence or phrase that happens to reuse the word, not a better take.
const SOUND = /\[sound:([^\]]+)\]/;
const deckAudio = new Map<string, string>();
const lines = readFileSync(deckPath, 'utf8').split('\n');
for (const line of lines.slice(1)) {
	const cols = line.split('\t');
	if (cols.length < 3) continue;
	const my = cols[0].replace(/<\/?b>/g, '').trim();
	const m = cols[2].match(SOUND);
	if (!my || !m) continue;
	if (!deckAudio.has(my)) deckAudio.set(my, m[1]);
}

// ── What the app already speaks, and what already has real audio ──
const speakables = collectSpeakables();
const manifest: Record<string, string> = JSON.parse(readFileSync(manifestPath, 'utf8'));

const already = new Set(Object.keys(manifest));
const candidates = [...speakables].filter((t) => deckAudio.has(t) && !already.has(t));

console.log(
	`${speakables.size} speakable strings, ${already.size} already have real audio, ` +
		`${candidates.length} new match(es) found in the deck.`
);

if (candidates.length === 0) {
	process.exit(0);
}

if (dryRun) {
	for (const t of candidates) console.log(`  ${t}  <- ${deckAudio.get(t)}`);
	process.exit(0);
}

mkdirSync(outDir, { recursive: true });

let converted = 0;
let failed = 0;
for (const text of candidates) {
	const soundFile = deckAudio.get(text)!;
	const src = join(mediaDir, soundFile);
	if (!existsSync(src)) {
		console.error(`MISSING on disk: ${text} -> ${soundFile}`);
		failed++;
		continue;
	}
	const stem = audioHash(text, DEFAULT_VOICE);
	const dest = join(outDir, `${stem}.mp3`);
	const proc = Bun.spawnSync(
		[
			'ffmpeg', '-y', '-loglevel', 'error', '-i', src,
			'-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '24000', '-ac', '1', '-b:a', '48k', dest
		],
		{ stdout: 'ignore', stderr: 'pipe' }
	);
	if (proc.exitCode !== 0) {
		console.error(`ffmpeg failed for "${text}": ${proc.stderr.toString().slice(0, 200)}`);
		failed++;
		continue;
	}
	manifest[text] = stem;
	converted++;
	console.log(`ok: ${text} (${soundFile} -> ${stem}.mp3)`);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');
console.log(`\nConverted ${converted}, failed ${failed}. Wrote ${Object.keys(manifest).length} total entries.`);
