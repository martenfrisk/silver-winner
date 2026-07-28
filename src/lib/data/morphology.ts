// How course words come apart.
//
// Burmese builds heavily by compounding, and a learner who never sees that is
// memorizing every word as an opaque string. ရေဆာတယ် is not a new word once
// you know ရေ (water) and ဆာတယ် (hungry) — it is "water-hungry", and it costs
// nothing to store. Morphological awareness is one of the better-supported
// multipliers on vocabulary growth, and it compounds with itself: each part
// you learn makes the next word containing it cheaper.
//
// Only words the course actually teaches appear here, and `lint:content`
// enforces two things: the parts must concatenate back to the word exactly,
// and the word must be real course vocabulary. A part whose standalone
// dictionary form differs from its form inside the word (ဆယ် → ဆယ့် before
// another number) carries `base` so the surface check still passes while the
// link points somewhere useful.
//
// Glosses here are deliberately plain and, like the rest of the generated
// romanization, want a native-speaker pass (IDEAS #24) before anyone treats
// them as authoritative.

export interface MorphPart {
	/** The chunk exactly as it appears inside the word — these must concatenate. */
	my: string;
	/** Standalone form, when the surface form differs (sandhi, bound variants). */
	base?: string;
	gloss: string;
}

export const morphology: Record<string, MorphPart[]> = {
	// ── Numbers: the whole system is compounding ──────────────────────
	'ဆယ့်တစ်': [
		{ my: 'ဆယ့်', base: 'ဆယ်', gloss: 'ten' },
		{ my: 'တစ်', gloss: 'one' }
	],
	'နှစ်ဆယ်': [
		{ my: 'နှစ်', gloss: 'two' },
		{ my: 'ဆယ်', gloss: 'ten' }
	],
	'တစ်ရာ': [
		{ my: 'တစ်', gloss: 'one' },
		{ my: 'ရာ', gloss: 'hundred' }
	],
	'တစ်ထောင်': [
		{ my: 'တစ်', gloss: 'one' },
		{ my: 'ထောင်', gloss: 'thousand' }
	],
	'ငါးထောင်': [
		{ my: 'ငါး', gloss: 'five' },
		{ my: 'ထောင်', gloss: 'thousand' }
	],
	// Counting always pairs a number with a classifier chosen by what's counted.
	'တစ်ခု': [
		{ my: 'တစ်', gloss: 'one' },
		{ my: 'ခု', gloss: 'thing (classifier)' }
	],
	'နှစ်ခု': [
		{ my: 'နှစ်', gloss: 'two' },
		{ my: 'ခု', gloss: 'thing (classifier)' }
	],
	'တစ်ယောက်': [
		{ my: 'တစ်', gloss: 'one' },
		{ my: 'ယောက်', gloss: 'person (classifier)' }
	],

	// ── Negation is a wrapper, not a word ─────────────────────────────
	// မ goes in front and ဘူး on the end; the verb sits between them.
	'မဟုတ်ဘူး': [
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'ဟုတ်', gloss: 'be so' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],
	'မကောင်းဘူး': [
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'ကောင်း', gloss: 'good' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],
	'မကြိုက်ဘူး': [
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'ကြိုက်', gloss: 'like' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],
	'မသိဘူး': [
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'သိ', gloss: 'know' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],
	'မလိုဘူး': [
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'လို', gloss: 'need' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],
	'နားမလည်ဘူး': [
		{ my: 'နား', gloss: 'ear' },
		{ my: 'မ', gloss: 'not (opens negation)' },
		{ my: 'လည်', gloss: 'understand' },
		{ my: 'ဘူး', gloss: '(closes negation)' }
	],

	// ── Wanting: ချင် slots between the verb and its ending ───────────
	'စားချင်တယ်': [
		{ my: 'စား', gloss: 'eat' },
		{ my: 'ချင်', gloss: 'want to' },
		{ my: 'တယ်', gloss: '(statement ending)' }
	],
	'သောက်ချင်တယ်': [
		{ my: 'သောက်', gloss: 'drink' },
		{ my: 'ချင်', gloss: 'want to' },
		{ my: 'တယ်', gloss: '(statement ending)' }
	],

	// ── Bodily states are built from a body part plus a feeling ───────
	'ဗိုက်ဆာတယ်': [
		{ my: 'ဗိုက်', gloss: 'belly' },
		{ my: 'ဆာ', base: 'ဆာတယ်', gloss: 'be hungry' },
		{ my: 'တယ်', gloss: '(statement ending)' }
	],
	// Thirst is "water-hunger" — the clearest compound in the course.
	'ရေဆာတယ်': [
		{ my: 'ရေ', gloss: 'water' },
		{ my: 'ဆာ', base: 'ဆာတယ်', gloss: 'be hungry' },
		{ my: 'တယ်', gloss: '(statement ending)' }
	],

	// ── Meals: a time of day plus စာ ──────────────────────────────────
	// စာ is the same syllable taught as "writing"; in a meal name it is the
	// food sense. Same shape, different word — worth meeting head on.
	'မနက်စာ': [
		{ my: 'မနက်', gloss: 'morning' },
		{ my: 'စာ', gloss: 'meal (not "writing" here)' }
	],
	'နေ့လယ်စာ': [
		{ my: 'နေ့လယ်', gloss: 'midday' },
		{ my: 'စာ', gloss: 'meal (not "writing" here)' }
	],
	'ညစာ': [
		{ my: 'ည', gloss: 'night' },
		{ my: 'စာ', gloss: 'meal (not "writing" here)' }
	],

	// ── Days of the week all end in နေ့ ───────────────────────────────
	'တနင်္လာနေ့': [
		{ my: 'တနင်္လာ', gloss: 'Monday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'အင်္ဂါနေ့': [
		{ my: 'အင်္ဂါ', gloss: 'Tuesday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'ဗုဒ္ဓဟူးနေ့': [
		{ my: 'ဗုဒ္ဓဟူး', gloss: 'Wednesday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'ကြာသပတေးနေ့': [
		{ my: 'ကြာသပတေး', gloss: 'Thursday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'သောကြာနေ့': [
		{ my: 'သောကြာ', gloss: 'Friday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'စနေနေ့': [
		{ my: 'စနေ', gloss: 'Saturday' },
		{ my: 'နေ့', gloss: 'day' }
	],
	'တနင်္ဂနွေနေ့': [
		{ my: 'တနင်္ဂနွေ', gloss: 'Sunday' },
		{ my: 'နေ့', gloss: 'day' }
	],

	// ── Directions and places ─────────────────────────────────────────
	'ဘယ်ဘက်': [
		{ my: 'ဘယ်', gloss: 'left' },
		{ my: 'ဘက်', gloss: 'side' }
	],
	'ညာဘက်': [
		{ my: 'ညာ', gloss: 'right' },
		{ my: 'ဘက်', gloss: 'side' }
	],
	'ဆေးရုံ': [
		{ my: 'ဆေး', gloss: 'medicine' },
		{ my: 'ရုံ', gloss: 'hall, building' }
	],

	// ── Whole phrases are compounds too ───────────────────────────────
	'ငါချစ်တယ်': [
		{ my: 'ငါ', gloss: 'I (casual)' },
		{ my: 'ချစ်', base: 'ချစ်တယ်', gloss: 'love' },
		{ my: 'တယ်', gloss: '(statement ending)' }
	],
	'ဒီမှာရပ်ပါ': [
		{ my: 'ဒီမှာ', gloss: 'here' },
		{ my: 'ရပ်ပါ', gloss: 'please stop' }
	],
	'ဘယ်ဘက်ကွေ့ပါ': [
		{ my: 'ဘယ်ဘက်', gloss: 'left side' },
		{ my: 'ကွေ့ပါ', gloss: 'please turn' }
	],
	'ဖြည်းဖြည်းသွားပါ': [
		{ my: 'ဖြည်းဖြည်း', gloss: 'slowly' },
		{ my: 'သွားပါ', gloss: 'please go' }
	],
	'အရမ်းကောင်းတယ်': [
		{ my: 'အရမ်း', gloss: 'very, so' },
		{ my: 'ကောင်းတယ်', gloss: "it's good" }
	],
	'ကျွန်တော်ရဲ့မိသားစု': [
		{ my: 'ကျွန်တော်', gloss: 'I (male speaker)' },
		{ my: 'ရဲ့', gloss: "'s (possessive)" },
		{ my: 'မိသားစု', gloss: 'family' }
	],
	'မင်္ဂလာပါ ခင်ဗျာ': [
		{ my: 'မင်္ဂလာပါ', gloss: 'hello' },
		{ my: ' ', gloss: '' },
		{ my: 'ခင်ဗျာ', gloss: 'polite particle (male speaker)' }
	],

	// ── Question frames ───────────────────────────────────────────────
	// These four were being explained in prose on the learn card, which is
	// where the romanization crept in. The structure is the teaching point,
	// so it belongs in the table the card can render.
	'ဒါဘာလဲ': [
		{ my: 'ဒါ', gloss: 'this' },
		{ my: 'ဘာ', gloss: 'what' },
		{ my: 'လဲ', gloss: '(open question)' }
	],
	'နေကောင်းလား': [
		{ my: 'နေ', gloss: 'be, stay' },
		{ my: 'ကောင်း', base: 'ကောင်းတယ်', gloss: 'be good' },
		{ my: 'လား', gloss: '(yes/no question)' }
	],
	'ဘယ်လောက်လဲ': [
		{ my: 'ဘယ်', gloss: 'which, what' },
		{ my: 'လောက်', gloss: 'amount' },
		{ my: 'လဲ', gloss: '(open question)' }
	],
	'မနက်ဖြန်တွေ့မယ်': [
		{ my: 'မနက်ဖြန်', gloss: 'tomorrow' },
		{ my: 'တွေ့', base: 'တွေ့မယ်', gloss: 'meet' },
		{ my: 'မယ်', gloss: '(future ending)' }
	],

	// ── Compounds of words the course already teaches ──────────────────
	// The `built-from-parts` lesson is nothing but these, so the breakdown
	// below is the lesson's actual content rather than a footnote on it.
	// Note what the surface forms show: ဆိုင်, ကျောင်း and ကြီး all voice at
	// the seam, which is why that lesson ships without romanization at all.
	'လက်ဖက်ရည်ဆိုင်': [
		{ my: 'လက်ဖက်ရည်', gloss: 'tea' },
		{ my: 'ဆိုင်', gloss: 'shop' }
	],
	'စားသောက်ဆိုင်': [
		{ my: 'စား', base: 'စားချင်တယ်', gloss: 'eat' },
		{ my: 'သောက်', base: 'သောက်ချင်တယ်', gloss: 'drink' },
		{ my: 'ဆိုင်', gloss: 'shop' }
	],
	'အရက်ဆိုင်': [
		{ my: 'အရက်', gloss: 'liquor' },
		{ my: 'ဆိုင်', gloss: 'shop' }
	],
	'ဆိုင်ရှင်': [
		{ my: 'ဆိုင်', gloss: 'shop' },
		{ my: 'ရှင်', gloss: 'owner' }
	],
	'ကိတ်မုန့်': [
		{ my: 'ကိတ်', gloss: 'cake' },
		{ my: 'မုန့်', gloss: 'snack, baked thing' }
	],
	'ပေါင်မုန့်': [
		{ my: 'ပေါင်', gloss: 'loaf, pound' },
		{ my: 'မုန့်', gloss: 'snack, baked thing' }
	],
	'ရေခဲမုန့်': [
		{ my: 'ရေခဲ', gloss: 'ice' },
		{ my: 'မုန့်', gloss: 'snack, baked thing' }
	],
	'ဘုန်းကြီးကျောင်း': [
		{ my: 'ဘုန်းကြီး', gloss: 'monk' },
		{ my: 'ကျောင်း', gloss: 'school' }
	],
	'ဘုရားလမ်း': [
		{ my: 'ဘုရား', gloss: 'pagoda' },
		{ my: 'လမ်း', gloss: 'road' }
	],
	'ဗိုလ်ကြီး': [
		{ my: 'ဗိုလ်', gloss: 'officer' },
		{ my: 'ကြီး', base: 'ကြီးတယ်', gloss: 'big, senior' }
	],
	'မုန့်သည်': [
		{ my: 'မုန့်', gloss: 'snack, baked thing' },
		{ my: 'သည်', gloss: 'one who deals in it' }
	],
	'ရေသည်': [
		{ my: 'ရေ', gloss: 'water' },
		{ my: 'သည်', gloss: 'one who deals in it' }
	],
	'ကုန်သည်': [
		{ my: 'ကုန်', gloss: 'goods' },
		{ my: 'သည်', gloss: 'one who deals in it' }
	],
	'ငါးကျပ်': [
		{ my: 'ငါး', gloss: 'five' },
		{ my: 'ကျပ်', gloss: 'kyat' }
	],
	'ငါးနာရီ': [
		{ my: 'ငါး', gloss: 'five' },
		{ my: 'နာရီ', gloss: "hour, o'clock" }
	]
};

/** Words that share a part with `my`, so the dictionary can cross-link them. */
export function sharesPartWith(my: string): string[] {
	const parts = morphology[my];
	if (!parts) return [];
	const keys = new Set(parts.map((p) => p.base ?? p.my).filter((p) => p.trim()));
	const out: string[] = [];
	for (const [word, others] of Object.entries(morphology)) {
		if (word === my) continue;
		if (others.some((p) => keys.has(p.base ?? p.my))) out.push(word);
	}
	return out;
}
