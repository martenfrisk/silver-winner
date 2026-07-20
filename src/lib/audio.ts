// Tiny Web Audio synth for UI feedback sounds, plus Burmese pronunciation:
// pre-generated neural TTS files (see scripts/generate-audio.ts) with
// platform speech synthesis as a fallback.
import { progress } from '$lib/progress.svelte';
import manifest from '$lib/audio-manifest.json';

const pronunciations: Record<string, string> = manifest;

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
	if (text && text in pronunciations) return true;
	return burmeseVoice() !== null;
}

const audioCache = new Map<string, HTMLAudioElement>();
let current: HTMLAudioElement | null = null;

/**
 * Speaks Burmese text — from a pre-generated audio file when available,
 * otherwise via platform speech synthesis. Returns whether it spoke.
 */
export function speak(text: string): boolean {
	if (!progress.audioOn || typeof window === 'undefined') return false;

	const file = pronunciations[text];
	if (file) {
		let a = audioCache.get(file);
		if (!a) {
			a = new Audio(`/${file}`);
			audioCache.set(file, a);
		}
		current?.pause();
		current = a;
		a.currentTime = 0;
		// Autoplay can be rejected before the first user gesture — fine to ignore.
		void a.play().catch(() => {});
		return true;
	}

	const voice = burmeseVoice();
	if (!voice) return false;
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.voice = voice;
	u.lang = voice.lang;
	u.rate = 0.85;
	speechSynthesis.speak(u);
	return true;
}
