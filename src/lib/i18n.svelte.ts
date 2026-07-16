// Immersion mode: with the setting on, UI chrome switches from English to
// Burmese in tiers as the learner's script knowledge grows — like setting
// your phone to the target language, but gradual.
//
// Tier thresholds are based on how many glyphs have been introduced in the
// Script Studio. With immersion off (default), everything stays English.
import { progress } from '$lib/progress.svelte';
import { srs } from '$lib/srs.svelte';

interface UiString {
	en: string;
	my: string;
	/** Immersion tier at which the Burmese version kicks in (1 = earliest). */
	tier: 1 | 2 | 3;
}

const STRINGS = {
	continue: { en: 'Continue', my: 'ရှေ့ဆက်', tier: 1 },
	check: { en: 'Check', my: 'စစ်ဆေး', tier: 1 },
	skip: { en: 'Skip', my: 'ကျော်', tier: 1 },
	'got-it': { en: 'Got it', my: 'ရပြီ', tier: 1 },
	start: { en: 'START', my: 'စ!', tier: 1 },
	practice: { en: 'Practice', my: 'လေ့ကျင့်', tier: 1 },
	'not-quite': { en: 'Not quite…', my: 'မမှန်ဘူး…', tier: 2 },
	answer: { en: 'Answer', my: 'အဖြေ', tier: 2 },
	'lesson-complete': { en: 'Lesson complete!', my: 'သင်ခန်းစာ ပြီးပြီ!', tier: 2 },
	'welcome-back': { en: 'Welcome back!', my: 'ပြန်ကြိုဆိုပါတယ်!', tier: 2 },
	'xp-earned': { en: 'XP earned', my: 'ရမှတ်', tier: 2 },
	accuracy: { en: 'Accuracy', my: 'တိကျမှု', tier: 2 },
	streak: { en: 'Streak', my: 'ရက်ဆက်', tier: 2 },
	'match-pairs': { en: 'Tap the matching pairs', my: 'တွဲပါ', tier: 2 },
	'tap-hear': { en: 'Tap what you hear', my: 'ကြားတာကို နှိပ်ပါ', tier: 2 },
	'script-studio': { en: 'Script Studio', my: 'အက္ခရာ စတူဒီယို', tier: 2 },
	'to-review': { en: 'to review', my: 'ပြန်လေ့ကျင့်ရန်', tier: 3 },
	profile: { en: 'Profile', my: 'ပရိုဖိုင်', tier: 3 },
	settings: { en: 'Settings', my: 'ဆက်တင်', tier: 3 },
	'what-sound': { en: 'What sound does this make?', my: 'ဘာအသံလဲ?', tier: 2 },
	'what-say': { en: 'What does it say?', my: 'ဘာဖတ်ရလဲ?', tier: 2 },
	'which-hear': { en: 'Which one did you hear?', my: 'ဘာကြားရလဲ?', tier: 2 },
	'what-mean': { en: 'What does it mean?', my: 'ဘာအဓိပ္ပာယ်လဲ?', tier: 2 },
	'trace-it': { en: 'Trace it!', my: 'ရေးကြည့်ပါ!', tier: 2 }
} satisfies Record<string, UiString>;

export type UiKey = keyof typeof STRINGS;

/** Current immersion tier: 0 = English everywhere. */
export function immersionTier(): number {
	if (!progress.immersion) return 0;
	const n = srs.introducedCount;
	if (n >= 30) return 3;
	if (n >= 15) return 2;
	if (n >= 5) return 1;
	return 0;
}

export interface UiText {
	text: string;
	/** English original, set only when the Burmese version is shown (for tooltips). */
	hint?: string;
	/** True when the Burmese string is being shown (callers may switch fonts). */
	my: boolean;
}

/** Resolves a UI string for the current immersion tier. */
export function ui(key: UiKey): UiText {
	const s = STRINGS[key];
	if (immersionTier() >= s.tier) return { text: s.my, hint: s.en, my: true };
	return { text: s.en, my: false };
}
