// The TTS voices every Burmese string is rendered in.
//
// More than one voice exists for a learning reason, not a cosmetic one. In
// high-variability phonetic training (Logan, Lively & Pisoni 1991 and the work
// after it), hearing a contrast from a *single* talker lets the learner build
// an acoustic template of that talker's ခ rather than the feature that makes
// it ခ — gains that don't survive a new voice. Hearing the same contrast from
// several talkers forces the abstraction, and the gains generalize.
//
// Edge's neural TTS ships exactly two Burmese voices, so this is a weaker
// version of that paradigm than the literature uses (5-6 human talkers), and
// two voices from one vendor likely share far more acoustically than two
// people would. It's enough to stop a drill being one voice forever; it is not
// enough to claim the generalization result. Two talkers also means there is
// no third voice to hold out as an unheard test, so the app doesn't try to
// measure generalization — it just trains across what it has.

export type VoiceId = 'f' | 'm';

export interface Voice {
	/** Edge neural TTS voice name, passed to edge-tts --voice. */
	tts: string;
	label: string;
}

/** The voice whose files are named by the bare text hash — see audioHash. */
export const DEFAULT_VOICE: VoiceId = 'f';

// Labelled by what the learner can actually hear, not by the vendor's name for
// the voice: "Nilar" and "Thiha" mean nothing to someone picking a speaker.
export const VOICES: Record<VoiceId, Voice> = {
	f: { tts: 'my-MM-NilarNeural', label: 'Female' },
	m: { tts: 'my-MM-ThihaNeural', label: 'Male' }
};

export const VOICE_IDS = Object.keys(VOICES) as VoiceId[];

export function isVoiceId(u: unknown): u is VoiceId {
	return typeof u === 'string' && u in VOICES;
}

/** djb2 — stable tiny hash for filenames. */
function djb2(s: string): string {
	let h = 5381;
	for (const c of s) h = (h * 33) ^ c.codePointAt(0)!;
	return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Filename stem for one string in one voice.
 *
 * The default voice deliberately hashes the bare text, which is what the
 * single-voice pipeline did: it keeps every already-generated file valid
 * instead of orphaning ~600 mp3s and re-rendering them for a rename.
 */
export function audioHash(text: string, voice: VoiceId): string {
	return djb2(voice === DEFAULT_VOICE ? text : `${voice}:${text}`);
}
