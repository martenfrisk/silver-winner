// Keeping exercises answerable when audio is off (see progress.tempMute).
//
// Two different problems, because the two exercise shapes differ:
//
//   Course exercises — a `listen` drill plays a word and offers written
//   Burmese options. Silence removes the question but not the answers, so it
//   converts cleanly into a reading drill over the same options: "Which one
//   says X?". Same options, same correct index, so grading and mistake
//   tracking are untouched.
//
//   Script Studio drills — minimal-pair and tone drills offer two written
//   syllables and ask which one you *heard*. There is no silent equivalent:
//   without the audio the two options are equally valid. Those get skipped.
import type { Exercise } from '$lib/data/course';
import type { ScriptEx } from '$lib/script-session';
import { quoted } from '$lib/gloss';

type ListenEx = Extract<Exercise, { kind: 'listen' }>;
type ChoiceEx = Extract<Exercise, { kind: 'choice' }>;

function isListen(ex: { kind: string }): ex is ListenEx {
	return ex.kind === 'listen';
}

/** The silent stand-in for a listening drill: read the options, pick the meaning. */
function silentChoice(ex: ListenEx): ChoiceEx {
	return {
		kind: 'choice',
		question: `Which one says ${quoted(ex.en)}?`,
		options: ex.options,
		correct: ex.correct
	};
}

/**
 * Swaps a listening drill for its reading equivalent while audio is off.
 * Applied at render time, so muting mid-session converts the exercises still
 * ahead of the learner rather than stranding them on an unanswerable one.
 */
export function silentSafe<T extends { kind: string }>(ex: T, audioOn: boolean): T | ChoiceEx {
	if (!audioOn && isListen(ex)) return silentChoice(ex);
	return ex;
}

/**
 * Whether a Script Studio drill is unanswerable without sound: its prompt is
 * audio only (no glyph or syllable shown), so silence leaves nothing to go on.
 */
export function scriptNeedsAudio(ex: ScriptEx): boolean {
	// Read-aloud drills show the written form, so the prompt survives silence —
	// but the audio *is* the answer key, so there's nothing to check against.
	if (ex.kind === 'recall') return true;
	return ex.kind === 'choice' && !!ex.promptSpeak && !ex.promptBig;
}
