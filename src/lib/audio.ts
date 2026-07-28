// Tiny Web Audio synth for UI feedback sounds, plus Burmese pronunciation:
// pre-generated neural TTS files (see scripts/generate-audio.ts) with
// platform speech synthesis as a fallback.
import { progress } from '$lib/progress.svelte';
import manifest from '$lib/audio-manifest.json';
import humanManifest from '$lib/human-audio-manifest.json';
import { DEFAULT_VOICE, VOICE_IDS, type VoiceId } from '$lib/voices';
// Type-only, so this costs nothing at runtime — no course data is pulled in.
import type { Exercise } from '$lib/data/course';

/** text -> { voiceId: filename stem }. See scripts/generate-audio.ts. */
const pronunciations: Record<string, Partial<Record<VoiceId, string>>> = manifest;

/**
 * text -> filename stem, for real human recordings (see IDEAS.md Round 18).
 * Deliberately not a third `VoiceId`: the `f`/`m` split exists to vary the
 * talker in controlled contrast drills, where a sparse, one-off recording
 * would break the comparison rather than improve it (see $lib/voices). This
 * is a separate, much smaller override — one clip per string, no coverage
 * expected — that beats synthesized speech everywhere else. Files live in
 * `static/audio-human/` rather than `static/audio/` so the two never mix.
 */
const humanClips: Record<string, string> = humanManifest;

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

interface Note {
	freq: number;
	at: number; // seconds from now
	dur: number;
	type?: OscillatorType;
	gain?: number;
}

function play(notes: Note[]) {
	if (!progress.audioOn) return;
	const c = ac();
	if (!c) return;
	const now = c.currentTime;
	for (const n of notes) {
		const osc = c.createOscillator();
		const g = c.createGain();
		osc.type = n.type ?? 'sine';
		osc.frequency.setValueAtTime(n.freq, now + n.at);
		const peak = n.gain ?? 0.18;
		g.gain.setValueAtTime(0, now + n.at);
		g.gain.linearRampToValueAtTime(peak, now + n.at + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, now + n.at + n.dur);
		osc.connect(g).connect(c.destination);
		osc.start(now + n.at);
		osc.stop(now + n.at + n.dur + 0.05);
	}
}

export const sfx = {
	/** Soft blip for taps/selections. */
	tap() {
		play([{ freq: 880, at: 0, dur: 0.08, type: 'triangle', gain: 0.08 }]);
	},
	/** Bright two-note chime for a correct answer. */
	correct() {
		play([
			{ freq: 659.25, at: 0, dur: 0.15, type: 'triangle' },
			{ freq: 987.77, at: 0.09, dur: 0.25, type: 'triangle' }
		]);
	},
	/** Low sagging buzz for a wrong answer. */
	wrong() {
		play([
			{ freq: 196, at: 0, dur: 0.2, type: 'sawtooth', gain: 0.1 },
			{ freq: 155.56, at: 0.12, dur: 0.3, type: 'sawtooth', gain: 0.1 }
		]);
	},
	/** Little pop when a pair matches. */
	match() {
		play([
			{ freq: 523.25, at: 0, dur: 0.1, type: 'triangle', gain: 0.12 },
			{ freq: 783.99, at: 0.06, dur: 0.14, type: 'triangle', gain: 0.12 }
		]);
	},
	/** Celebration fanfare for finishing a lesson. */
	fanfare() {
		play([
			{ freq: 523.25, at: 0, dur: 0.18, type: 'triangle' },
			{ freq: 659.25, at: 0.14, dur: 0.18, type: 'triangle' },
			{ freq: 783.99, at: 0.28, dur: 0.18, type: 'triangle' },
			{ freq: 1046.5, at: 0.42, dur: 0.5, type: 'triangle', gain: 0.2 },
			{ freq: 1318.5, at: 0.42, dur: 0.5, type: 'sine', gain: 0.08 }
		]);
	}
};

let myVoice: SpeechSynthesisVoice | null | undefined;

/** Finds a Burmese voice once; undefined = not checked, null = none available. */
function burmeseVoice(): SpeechSynthesisVoice | null {
	if (typeof speechSynthesis === 'undefined') return null;
	if (myVoice !== undefined) return myVoice;
	const voices = speechSynthesis.getVoices();
	if (voices.length === 0) {
		// Voice list not loaded yet — try again next call.
		return null;
	}
	myVoice = voices.find((v) => v.lang.toLowerCase().startsWith('my')) ?? null;
	return myVoice;
}

export function canSpeak(text?: string): boolean {
	if (text && (text in pronunciations || text in humanClips)) return true;
	return burmeseVoice() !== null;
}

/** Which voices a string was actually rendered in — usually all of them. */
export function voicesFor(text: string): VoiceId[] {
	const entry = pronunciations[text];
	if (!entry) return [];
	return VOICE_IDS.filter((v) => entry[v]);
}

/**
 * Picks a voice for one trial, rotating deterministically on `seed`.
 *
 * Deterministic rather than random so a trial keeps the same voice across
 * re-renders — the alternative is the talker changing when a replay button is
 * pressed, which turns a listening drill into a different question. Falls back
 * to the learner's preferred voice when the string has only one rendering.
 */
export function voiceForTrial(text: string, seed: number): VoiceId {
	const available = voicesFor(text);
	if (available.length <= 1) return available[0] ?? preferredVoice();
	return available[Math.abs(Math.trunc(seed)) % available.length];
}

function preferredVoice(): VoiceId {
	return progress.voice;
}

const audioCache = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;

function cachedElement(src: string): HTMLAudioElement {
	let a = audioCache.get(src);
	if (!a) {
		a = new Audio(src);
		a.preload = 'auto';
		audioCache.set(src, a);
	}
	return a;
}

/** Element for `text` in `voice`, created (and so started downloading) on first ask. */
function element(text: string, voice?: VoiceId): HTMLAudioElement | null {
	// A real recording beats synthesized speech — but only when the caller
	// isn't deliberately requesting a specific TTS talker. Contrast drills
	// (aspiration/tone pairs) always pass `voice` explicitly, because the
	// comparison depends on exactly that voice; silently swapping in a human
	// clip there would change the question, not just its quality.
	if (!voice) {
		const humanStem = humanClips[text];
		if (humanStem) return cachedElement(`/audio-human/${humanStem}.mp3`);
	}
	const entry = pronunciations[text];
	if (!entry) return null;
	// Fall back through the requested voice, the learner's preference, then the
	// default, so a string rendered in only one voice still plays.
	const stem =
		(voice && entry[voice]) ?? entry[preferredVoice()] ?? entry[DEFAULT_VOICE] ?? firstStem(entry);
	if (!stem) return null;
	return cachedElement(`/audio/${stem}.mp3`);
}

function firstStem(entry: Partial<Record<VoiceId, string>>): string | undefined {
	for (const v of VOICE_IDS) if (entry[v]) return entry[v];
	return undefined;
}

/**
 * Warms the clips an exercise is about to need.
 *
 * Clips are fetched on first play, and drills auto-speak ~350ms after the card
 * mounts — so without this the learner waits out a network round trip at the
 * exact moment the sound matters. Fetching during the *previous* exercise
 * hides that latency, and populates the service worker's audio cache as a
 * side effect. Unknown strings (no pre-generated file) are ignored.
 */
export function prefetch(texts: (string | undefined | null)[]): void {
	if (typeof window === 'undefined' || !progress.audioOn) return;
	for (const t of texts) if (t) element(t);
}

/**
 * The strings an exercise actually plays: its prompt, plus the correct answer
 * (spoken on both the win chime and the wrong-answer reveal). Distractor
 * options are only ever shown, never spoken, so fetching them would be waste.
 *
 * Getting this wrong costs a cold cache, never correctness — unlike the
 * collection loops in lint-content.ts and generate-audio.ts, which must agree.
 */
export function speakablesOf(ex: Exercise | undefined): string[] {
	if (!ex) return [];
	switch (ex.kind) {
		case 'learn':
		case 'assemble':
		case 'listen':
			return [ex.my];
		case 'choice':
			return [ex.promptMy, ex.options[ex.correct]?.text].filter((t): t is string => !!t);
		case 'match':
			// Each left-hand pair is spoken as it's matched.
			return ex.pairs.map((p) => p.l);
	}
}

/**
 * Speaks Burmese text — from a pre-generated audio file when available,
 * otherwise via platform speech synthesis. Returns whether it spoke.
 */
export function speak(text: string, voice?: VoiceId): boolean {
	if (!progress.audioOn || typeof window === 'undefined') return false;

	const a = element(text, voice);
	if (a) {
		current?.pause();
		current = a;
		a.currentTime = 0;
		// Autoplay can be rejected before the first user gesture — fine to ignore.
		void a.play().catch(() => {});
		return true;
	}

	// No pre-generated file — fall back to a platform voice. The requested
	// VoiceId has no meaning here; the OS offers whatever Burmese voice it has.
	const systemVoice = burmeseVoice();
	if (!systemVoice) return false;
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.voice = systemVoice;
	u.lang = systemVoice.lang;
	u.rate = 0.85;
	speechSynthesis.speak(u);
	return true;
}
