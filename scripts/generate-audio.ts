// Generates static MP3 pronunciation files for every Burmese string in the
// course using Microsoft Edge's neural TTS, in every voice in $lib/voices.
//
// Usage:
//   pip install edge-tts        (or point EDGE_TTS at the binary)
//   bun run audio               all voices, skipping files already on disk
//   bun run audio --voice m     just one voice
//
// Output: static/audio/<hash>.mp3 + src/lib/audio-manifest.json, which maps
// each string to a { voiceId: hash } record. The manifest stores the bare
// hash rather than the path because it ships in the client bundle and the
// "audio/" prefix on every entry was pure repetition.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_VOICE, VOICES, VOICE_IDS, audioHash, isVoiceId } from '../src/lib/voices';
import { collectSpeakables } from './speakables';

const EDGE_TTS = process.env.EDGE_TTS ?? 'edge-tts';
const outDir = join(import.meta.dir, '../static/audio');
const manifestPath = join(import.meta.dir, '../src/lib/audio-manifest.json');

const voiceArg = process.argv[process.argv.indexOf('--voice') + 1];
const wanted = process.argv.includes('--voice') && isVoiceId(voiceArg) ? [voiceArg] : VOICE_IDS;

const texts = [...collectSpeakables()];
mkdirSync(outDir, { recursive: true });

/** Every (text, voice) pair we want on disk. */
const jobs = texts.flatMap((text) =>
	wanted.map((voice) => ({ text, voice, stem: audioHash(text, voice) }))
);
const todo = jobs.filter((j) => !existsSync(join(outDir, `${j.stem}.mp3`)));

console.log(
	`${texts.length} strings × ${wanted.length} voice(s) (${wanted.join(', ')}) — ${todo.length} to generate`
);

let failed = 0;
const CONCURRENCY = 4;
for (let i = 0; i < todo.length; i += CONCURRENCY) {
	const batch = todo.slice(i, i + CONCURRENCY);
	await Promise.all(
		batch.map(async ({ text, voice, stem }) => {
			const dest = join(outDir, `${stem}.mp3`);
			const proc = Bun.spawn(
				[EDGE_TTS, '--voice', VOICES[voice].tts, '--text', text, '--write-media', dest],
				{ stdout: 'ignore', stderr: 'pipe' }
			);
			const code = await proc.exited;
			if (code !== 0) {
				failed++;
				console.error(`FAILED [${voice}]: ${text}\n${await new Response(proc.stderr).text()}`);
			} else {
				console.log(`ok [${voice}]: ${text}`);
			}
		})
	);
}

if (failed > 0) {
	console.error(`\n${failed} file(s) failed — manifest not written. Re-run to retry.`);
	process.exit(1);
}

// The manifest lists a voice only when its file is actually on disk, so a
// partial run (`--voice m` interrupted, say) degrades to fewer voices for some
// strings rather than pointing the app at files that aren't there.
const manifest: Record<string, Record<string, string>> = {};
for (const text of texts) {
	const available: Record<string, string> = {};
	for (const voice of VOICE_IDS) {
		const stem = audioHash(text, voice);
		if (existsSync(join(outDir, `${stem}.mp3`))) available[voice] = stem;
	}
	if (Object.keys(available).length > 0) manifest[text] = available;
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, '\t') + '\n');

const full = Object.values(manifest).filter((v) => Object.keys(v).length === VOICE_IDS.length);
console.log(
	`\nWrote ${Object.keys(manifest).length} entries to src/lib/audio-manifest.json ` +
		`(${full.length} with all ${VOICE_IDS.length} voices, default ${DEFAULT_VOICE})`
);
