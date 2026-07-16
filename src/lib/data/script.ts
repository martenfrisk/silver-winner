// Script Studio data: the Burmese script as structured, teachable units.
//
// Glyph `name` fields are the traditional letter names (ka-gyi "big ka",
// sa-lone "round sa", …) — they describe the shapes and double as mnemonics.
// `speak` is the Burmese text used to generate name audio.

export type GlyphType = 'consonant' | 'vowel' | 'tone' | 'medial' | 'digit';

export interface Glyph {
	id: string;
	char: string;
	type: GlyphType;
	/** Traditional name, romanized. */
	name: string;
	/** What the name means / describes. */
	nameMeaning: string;
	/** The sound it makes (shown to the learner). */
	sound: string;
	mnemonic: string;
	/** Visually similar glyphs — used as drill distractors. */
	confusables: string[];
	/** Burmese text spoken aloud for this glyph. */
	speak: string;
	/** Whether a tracing exercise makes sense (standalone shapes only). */
	traceable: boolean;
}

const c = (
	id: string,
	char: string,
	name: string,
	nameMeaning: string,
	sound: string,
	mnemonic: string,
	confusables: string[],
	speak: string
): Glyph => ({ id, char, type: 'consonant', name, nameMeaning, sound, mnemonic, confusables, speak, traceable: true });

export const glyphs: Glyph[] = [
	// ── Consonants (traditional rows) ──────────────────────────────────
	c('ka', 'က', 'ka-gyi', 'big ka', 'k', 'Two circles side by side — a gate you walk through.', ['ha', 'ta'], 'ကကြီး'),
	c('kha', 'ခ', 'kha-gway', 'curved kha', 'kh', 'A circle with an open top — steam escaping: kh!', ['ga', 'nga'], 'ခခွေး'),
	c('ga', 'ဂ', 'ga-nge', 'little ga', 'g', 'An open mouth saying gaa. Add a tail and it becomes ရ.', ['kha', 'nga', 'ra'], 'ဂငယ်'),
	c('gha', 'ဃ', 'ga-gyi', 'big ga', 'g', 'Rare — the fancy twin of ဂ with a wavy roof.', ['ya', 'hta'], 'ဃကြီး'),
	c('nga', 'င', 'nga', 'nga', 'ng', 'A fishhook — remember ငါး means fish!', ['ga', 'kha', 'ra'], 'င'),
	c('sa', 'စ', 'sa-lone', 'round sa', 's', 'A single tight coil.', ['hsa', 'za', 'nya'], 'စလုံး'),
	c('hsa', 'ဆ', 'sa-lein', 'twisted sa', 'hs', 'စ with a twist flying off — the aspirated twin.', ['sa', 'za'], 'ဆလိမ်'),
	c('za', 'ဇ', 'za-gweh', 'split za', 'z', 'စ with a split tail: zzz.', ['sa', 'hsa'], 'ဇကွဲ'),
	c('nya', 'ည', 'nya-gyi', 'big nya', 'ny', 'On its own it also means “night”.', ['sa', 'za', 'nga'], 'ညကြီး'),
	c('ta', 'တ', 'ta-wun-bu', 'pot-bellied ta', 't', 'A round pot with an open lid.', ['ha', 'bha'], 'တဝမ်းပူ'),
	c('hta', 'ထ', 'hta-hsin-du', 'elephant-fetter hta', 'ht', 'Two humps, like an elephant’s fetter.', ['ya', 'gha'], 'ထဆင်ထူး'),
	c('da', 'ဒ', 'da-dway', 'curved da', 'd', 'A circle with a chin sticking out.', ['wa', 'pa', 'hpa'], 'ဒထွေး'),
	c('dha', 'ဓ', 'da-auk-chaik', 'bottom-dented da', 'd', 'ဒ’s twin with a dent underneath.', ['da', 'wa'], 'ဓအောက်ခြိုက်'),
	c('na', 'န', 'na-nge', 'little na', 'n', 'A circle with a swing hanging below.', ['la', 'ra'], 'နငယ်'),
	c('pa', 'ပ', 'pa-zauk', 'steep pa', 'p', 'An open-topped cup: p!', ['hpa', 'ba', 'wa'], 'ပစောက်'),
	c('hpa', 'ဖ', 'hpa-oo-htoke', 'hat-wearing hpa', 'hp', 'ပ wearing a little hat.', ['pa', 'ba'], 'ဖဦးထုပ်'),
	c('ba', 'ဗ', 'ba-htet-chaik', 'top-dented ba', 'b', 'ပ with a curl on top.', ['pa', 'hpa'], 'ဗထက်ခြိုက်'),
	c('bha', 'ဘ', 'ba-gone', 'humpbacked ba', 'b', 'Two cups joined — a double ပ.', ['ta', 'ha', 'da'], 'ဘကုန်း'),
	c('ma', 'မ', 'ma', 'ma', 'm', 'You already know it from မင်္ဂလာပါ!', ['ba', 'wa'], 'မ'),
	c('ya', 'ယ', 'ya-pet-let', 'supine ya', 'y', 'Lying on its back with arms up.', ['hta', 'gha'], 'ယပက်လက်'),
	c('ra', 'ရ', 'ya-gauk', 'curved ra', 'y', 'ဂ with a long tail. Once “r”, today it sounds like “y”.', ['ga', 'nga'], 'ရကောက်'),
	c('la', 'လ', 'la', 'la', 'l', 'A circle with a loop on top — also “moon”.', ['na', 'wa'], 'လ'),
	c('wa', 'ဝ', 'wa', 'wa', 'w', 'A perfect closed circle. Careful: the digit zero ၀ looks the same!', ['da', 'pa', 'la'], 'ဝ'),
	c('tha', 'သ', 'tha', 'tha', 'th', 'Two circles fused at the hip.', ['wa', 'ma'], 'သ'),
	c('ha', 'ဟ', 'ha', 'ha', 'h', 'A pot with a chimney — hot air: h!', ['ta', 'bha'], 'ဟ'),
	c('a', 'အ', 'a', 'a', '(glottal) a', 'The vowel-carrier: the sound အ itself.', ['ma', 'tha'], 'အ'),

	// ── Vowel signs (attach around a consonant) ────────────────────────
	{ id: 'aa', char: 'ာ', type: 'vowel', name: 'yay-cha', nameMeaning: 'drawn-down stroke', sound: '-a (long)', mnemonic: 'A pole to the RIGHT of the letter. After ခ ဂ င ဒ ပ ဝ it grows tall: ါ.', confusables: ['asat'], speak: 'ရေးချ', traceable: false },
	{ id: 'i', char: 'ိ', type: 'vowel', name: 'lone-gyi-tin', nameMeaning: 'big circle on top', sound: '-i', mnemonic: 'A little circle on the roof.', confusables: ['ii'], speak: 'လုံးကြီးတင်', traceable: false },
	{ id: 'ii', char: 'ီ', type: 'vowel', name: 'lone-gyi-tin hsan-khat', nameMeaning: 'roof circle + whisker', sound: '-i (long)', mnemonic: 'The roof circle grows a whisker.', confusables: ['i'], speak: 'လုံးကြီးတင်ဆံခတ်', traceable: false },
	{ id: 'u', char: 'ု', type: 'vowel', name: 'ta-chaung-ngin', nameMeaning: 'one-stroke pull', sound: '-u', mnemonic: 'One hook below.', confusables: ['uu'], speak: 'တစ်ချောင်းငင်', traceable: false },
	{ id: 'uu', char: 'ူ', type: 'vowel', name: 'hna-chaung-ngin', nameMeaning: 'two-stroke pull', sound: '-u (long)', mnemonic: 'Two hooks below.', confusables: ['u'], speak: 'နှစ်ချောင်းငင်', traceable: false },
	{ id: 'ay', char: 'ေ', type: 'vowel', name: 'tha-way-htoe', nameMeaning: 'forward jab', sound: 'ay-', mnemonic: 'Written BEFORE the letter but spoken AFTER it: ay!', confusables: ['eh'], speak: 'သဝေထိုး', traceable: false },
	{ id: 'eh', char: 'ဲ', type: 'vowel', name: 'nauk-pyit', nameMeaning: 'backward flick', sound: '-eh', mnemonic: 'A flick thrown back over the shoulder.', confusables: ['ay'], speak: 'နောက်ပစ်', traceable: false },
	{ id: 'io', char: 'ို', type: 'vowel', name: 'lone-gyi-tin + ta-chaung-ngin', nameMeaning: 'roof circle + hook', sound: '-o', mnemonic: 'ိ and ု team up to say “o”.', confusables: ['i', 'u'], speak: 'အို', traceable: false },
	{ id: 'asat', char: '်', type: 'vowel', name: 'a-that', nameMeaning: 'the killer', sound: '(kills the vowel)', mnemonic: 'The killer stroke — silences the inherent “a” so the letter closes the syllable: က → -k.', confusables: ['eh'], speak: 'အသတ်', traceable: false },

	// ── Tone marks ─────────────────────────────────────────────────────
	{ id: 'visarga', char: 'း', type: 'tone', name: 'shay-ga-pauk', nameMeaning: 'two dots', sound: 'high tone', mnemonic: 'Two dots after the syllable — say it long and high.', confusables: ['dot'], speak: 'ဝစ္စပေါက်', traceable: false },
	{ id: 'dot', char: '့', type: 'tone', name: 'auk-myit', nameMeaning: 'dot below', sound: 'creaky tone', mnemonic: 'A dot tucked below — short and tight.', confusables: ['visarga'], speak: 'အောက်မြစ်', traceable: false },

	// ── Medials (blend into the consonant) ─────────────────────────────
	{ id: 'yapin', char: 'ျ', type: 'medial', name: 'ya-pin', nameMeaning: 'attached ya', sound: '+y', mnemonic: 'A slim ယ squeezed in: k → ky.', confusables: ['hahto'], speak: 'ယပင့်', traceable: false },
	{ id: 'yayit', char: 'ြ', type: 'medial', name: 'ya-yit', nameMeaning: 'wrapped ya', sound: '+y', mnemonic: 'Wraps the whole letter in a hug — same sound as ျ.', confusables: ['yapin'], speak: 'ရရစ်', traceable: false },
	{ id: 'wahswe', char: 'ွ', type: 'medial', name: 'wa-hswe', nameMeaning: 'hanging wa', sound: '+w', mnemonic: 'A little ဝ hanging below: k → kw.', confusables: ['u'], speak: 'ဝဆွဲ', traceable: false },
	{ id: 'hahto', char: 'ှ', type: 'medial', name: 'ha-hto', nameMeaning: 'jabbing ha', sound: '+h (breathy)', mnemonic: 'A hook that adds a whisper: m → hm.', confusables: ['yapin'], speak: 'ဟထိုး', traceable: false },

	// ── Digits ─────────────────────────────────────────────────────────
	{ id: 'd0', char: '၀', type: 'digit', name: 'thone-nya', nameMeaning: 'zero', sound: '0', mnemonic: 'A circle — just like ဝ (wa). Context tells them apart.', confusables: ['d1'], speak: 'သုည', traceable: true },
	{ id: 'd1', char: '၁', type: 'digit', name: 'tit', nameMeaning: 'one', sound: '1', mnemonic: 'One curl.', confusables: ['d2'], speak: 'တစ်', traceable: true },
	{ id: 'd2', char: '၂', type: 'digit', name: 'hnit', nameMeaning: 'two', sound: '2', mnemonic: 'Like ၁ with a longer tail.', confusables: ['d1', 'd6'], speak: 'နှစ်', traceable: true },
	{ id: 'd3', char: '၃', type: 'digit', name: 'thoun', nameMeaning: 'three', sound: '3', mnemonic: 'A rounded 3, easy!', confusables: ['d4'], speak: 'သုံး', traceable: true },
	{ id: 'd4', char: '၄', type: 'digit', name: 'lei', nameMeaning: 'four', sound: '4', mnemonic: 'A loop with a leg.', confusables: ['d3'], speak: 'လေး', traceable: true },
	{ id: 'd5', char: '၅', type: 'digit', name: 'nga', nameMeaning: 'five', sound: '5', mnemonic: 'A spiral like ၆ but closed.', confusables: ['d6'], speak: 'ငါး', traceable: true },
	{ id: 'd6', char: '၆', type: 'digit', name: 'chauk', nameMeaning: 'six', sound: '6', mnemonic: 'An open spiral.', confusables: ['d5', 'd2'], speak: 'ခြောက်', traceable: true },
	{ id: 'd7', char: '၇', type: 'digit', name: 'khu-hnit', nameMeaning: 'seven', sound: '7', mnemonic: 'A hook with a flat foot.', confusables: ['d2'], speak: 'ခုနစ်', traceable: true },
	{ id: 'd8', char: '၈', type: 'digit', name: 'shit', nameMeaning: 'eight', sound: '8', mnemonic: 'A wave going down.', confusables: ['d7'], speak: 'ရှစ်', traceable: true },
	{ id: 'd9', char: '၉', type: 'digit', name: 'kou', nameMeaning: 'nine', sound: '9', mnemonic: 'A 7 with a curled head.', confusables: ['d8'], speak: 'ကိုး', traceable: true }
];

export const glyphById = new Map(glyphs.map((g) => [g.id, g]));

/** Chart layout, grouped the traditional way. */
export const chartSections: { title: string; sub?: string; ids: string[] }[] = [
	{ title: 'Ka row', sub: 'ka kha ga gha nga', ids: ['ka', 'kha', 'ga', 'gha', 'nga'] },
	{ title: 'Sa row', sub: 'sa hsa za nya', ids: ['sa', 'hsa', 'za', 'nya'] },
	{ title: 'Ta row', sub: 'ta hta da dha na', ids: ['ta', 'hta', 'da', 'dha', 'na'] },
	{ title: 'Pa row', sub: 'pa hpa ba bha ma', ids: ['pa', 'hpa', 'ba', 'bha', 'ma'] },
	{ title: 'Mixed row', sub: 'ya ra la wa tha ha a', ids: ['ya', 'ra', 'la', 'wa', 'tha', 'ha', 'a'] },
	{ title: 'Vowel signs', ids: ['aa', 'i', 'ii', 'u', 'uu', 'ay', 'eh', 'io', 'asat'] },
	{ title: 'Tones', ids: ['visarga', 'dot'] },
	{ title: 'Medials', ids: ['yapin', 'yayit', 'wahswe', 'hahto'] },
	{ title: 'Digits', ids: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9'] }
];

// ── Syllable composition (the abugida machinery) ─────────────────────
/** Consonants that take the tall ါ instead of ာ. */
export const TALL_AA = new Set(['kha', 'ga', 'nga', 'da', 'pa', 'wa']);

const INITIAL: Record<string, string> = {
	ka: 'k', kha: 'kh', ga: 'g', gha: 'g', nga: 'ng',
	sa: 's', hsa: 'hs', za: 'z', nya: 'ny',
	ta: 't', hta: 'ht', da: 'd', dha: 'd', na: 'n',
	pa: 'p', hpa: 'hp', ba: 'b', bha: 'b', ma: 'm',
	ya: 'y', ra: 'y', la: 'l', wa: 'w', tha: 'th', ha: 'h', a: ''
};

const VOWEL_SOUND: Record<string, string> = {
	aa: 'a', i: 'i', ii: 'i', u: 'u', uu: 'u', ay: 'ay', eh: 'eh', io: 'o'
};

/** Vowels that have pre-generated syllable audio (used by drills + builder). */
export const AUDIO_VOWELS = ['aa', 'i', 'u', 'ay', 'io'];

export function buildSyllable(consId: string, vowelId: string, highTone = false) {
	const cons = glyphById.get(consId)!;
	let vchar: string;
	if (vowelId === 'aa') vchar = TALL_AA.has(consId) ? 'ါ' : 'ာ';
	else vchar = glyphById.get(vowelId)!.char;
	const text = cons.char + vchar + (highTone ? 'း' : '');
	const roman = (INITIAL[consId] ?? '?') + VOWEL_SOUND[vowelId] + (highTone ? '(high)' : '');
	return { text, roman: (INITIAL[consId] ?? '') + VOWEL_SOUND[vowelId], display: roman, highTone };
}

/** All syllables that have audio files (consonant × AUDIO_VOWELS × tone). */
export function allAudioSyllables(): { text: string }[] {
	const out: { text: string }[] = [];
	for (const g of glyphs) {
		if (g.type !== 'consonant') continue;
		for (const v of AUDIO_VOWELS) {
			out.push({ text: buildSyllable(g.id, v, false).text });
			out.push({ text: buildSyllable(g.id, v, true).text });
		}
	}
	return out;
}

// ── Minimal pairs (listening discrimination) ─────────────────────────
// Burmese contrasts plain vs aspirated stops — the classic stumbling block.
// Each pair is [unaspirated, aspirated]; both members are chart consonants,
// so every syllable built from them has pre-generated audio.
export const aspirationPairs: [string, string][] = [
	['ka', 'kha'], // က / ခ  (k / kʰ)
	['sa', 'hsa'], // စ / ဆ  (s / sʰ)
	['ta', 'hta'], // တ / ထ  (t / tʰ)
	['pa', 'hpa'] // ပ / ဖ  (p / pʰ)
];

/** Consonant id → its aspiration pair-mate. */
export const aspirationMate = new Map<string, string>(
	aspirationPairs.flatMap(([a, b]) => [
		[a, b],
		[b, a]
	] as [string, string][])
);

// ── Decodable words (readable using only learned components) ─────────
export interface DecodableWord {
	my: string;
	roman: string;
	en: string;
	parts: string[]; // glyph ids required to read it
}

export const decodableWords: Record<string, DecodableWord[]> = {
	'first-letters': [
		{ my: 'အမ', roman: 'a-ma', en: 'elder sister', parts: ['a', 'ma'] },
		{ my: 'မာ', roman: 'ma', en: 'hard', parts: ['ma', 'aa'] },
		{ my: 'နာ', roman: 'na', en: 'to hurt', parts: ['na', 'aa'] },
		{ my: 'ကာ', roman: 'ka', en: 'to shield', parts: ['ka', 'aa'] }
	],
	'hooks-and-tails': [
		{ my: 'မိ', roman: 'mi', en: 'to catch', parts: ['ma', 'i'] },
		{ my: 'နီ', roman: 'ni', en: 'red', parts: ['na', 'ii'] },
		{ my: 'ငါ', roman: 'nga', en: 'I / me', parts: ['nga', 'aa'] },
		{ my: 'တာ', roman: 'ta', en: 'duty', parts: ['ta', 'aa'] },
		{ my: 'ရတနာ', roman: 'ya-da-na', en: 'treasure', parts: ['ra', 'ta', 'na', 'aa'] }
	],
	'round-sounds': [
		{ my: 'လူ', roman: 'lu', en: 'person', parts: ['la', 'uu'] },
		{ my: 'ပူ', roman: 'pu', en: 'hot', parts: ['pa', 'uu'] },
		{ my: 'စာ', roman: 'sa', en: 'writing / letter', parts: ['sa', 'aa'] },
		{ my: 'ဘာ', roman: 'ba', en: 'what', parts: ['bha', 'aa'] },
		{ my: 'ပါ', roman: 'ba', en: 'please (particle)', parts: ['pa', 'aa'] },
		{ my: 'စု', roman: 'su', en: 'to gather', parts: ['sa', 'u'] }
	],
	'open-circles': [
		{ my: 'ရေ', roman: 'yay', en: 'water', parts: ['ra', 'ay'] },
		{ my: 'နေ', roman: 'nay', en: 'sun / to live', parts: ['na', 'ay'] },
		{ my: 'လေ', roman: 'lay', en: 'air / wind', parts: ['la', 'ay'] },
		{ my: 'ဒီ', roman: 'di', en: 'this', parts: ['da', 'ii'] },
		{ my: 'ဝါ', roman: 'wa', en: 'yellow', parts: ['wa', 'aa'] },
		{ my: 'ခါ', roman: 'kha', en: 'occasion', parts: ['kha', 'aa'] }
	],
	'twins-and-hats': [
		{ my: 'ယူ', roman: 'yu', en: 'to take', parts: ['ya', 'uu'] },
		{ my: 'ထူ', roman: 'htu', en: 'thick', parts: ['hta', 'uu'] },
		{ my: 'ဖဲ', roman: 'hpeh', en: 'playing cards', parts: ['hpa', 'eh'] },
		{ my: 'လဲ', roman: 'leh', en: 'to fall over', parts: ['la', 'eh'] },
		{ my: 'ခဲ', roman: 'kheh', en: 'solid', parts: ['kha', 'eh'] }
	],
	'night-letters': [
		{ my: 'ကို', roman: 'ko', en: 'older brother', parts: ['ka', 'io'] },
		{ my: 'လို', roman: 'lo', en: 'to want', parts: ['la', 'io'] },
		{ my: 'သာ', roman: 'tha', en: 'pleasant', parts: ['tha', 'aa'] },
		{ my: 'ဟာ', roman: 'ha', en: 'thing', parts: ['ha', 'aa'] },
		{ my: 'ညာ', roman: 'nya', en: 'right (side)', parts: ['nya', 'aa'] },
		{ my: 'ဇာ', roman: 'za', en: 'lace', parts: ['za', 'aa'] }
	],
	'killer-stroke': [
		{ my: 'လက်', roman: 'let', en: 'hand', parts: ['la', 'ka', 'asat'] },
		{ my: 'စက်', roman: 'set', en: 'machine', parts: ['sa', 'ka', 'asat'] },
		{ my: 'မနက်', roman: 'ma-net', en: 'morning', parts: ['ma', 'na', 'ka', 'asat'] },
		{ my: 'နက်', roman: 'net', en: 'deep', parts: ['na', 'ka', 'asat'] },
		{ my: 'ရက်', roman: 'yet', en: 'day (of month)', parts: ['ra', 'ka', 'asat'] }
	],
	tones: [
		{ my: 'ကား', roman: 'ka:', en: 'car', parts: ['ka', 'aa', 'visarga'] },
		{ my: 'စား', roman: 'sa:', en: 'to eat', parts: ['sa', 'aa', 'visarga'] },
		{ my: 'မီး', roman: 'mi:', en: 'fire', parts: ['ma', 'ii', 'visarga'] },
		{ my: 'ငါး', roman: 'nga:', en: 'fish', parts: ['nga', 'aa', 'visarga'] },
		{ my: 'နေ့', roman: 'nay.', en: 'day', parts: ['na', 'ay', 'dot'] },
		{ my: 'ရေး', roman: 'yay:', en: 'to write', parts: ['ra', 'ay', 'visarga'] }
	],
	blends: [
		{ my: 'ကျား', roman: 'kya:', en: 'tiger', parts: ['ka', 'yapin', 'aa', 'visarga'] },
		{ my: 'ပြာ', roman: 'pya', en: 'blue', parts: ['pa', 'yayit', 'aa'] },
		{ my: 'သွား', roman: 'thwa:', en: 'to go / tooth', parts: ['tha', 'wahswe', 'aa', 'visarga'] },
		{ my: 'နွား', roman: 'nwa:', en: 'cow', parts: ['na', 'wahswe', 'aa', 'visarga'] },
		{ my: 'လှေ', roman: 'hlay', en: 'boat', parts: ['la', 'hahto', 'ay'] },
		{ my: 'မြေ', roman: 'myay', en: 'earth / ground', parts: ['ma', 'yayit', 'ay'] }
	],
	digits: [],
	stacked: [
		{ my: 'ကမ္ဘာ', roman: 'ka-ba', en: 'world', parts: ['ka', 'ma', 'bha', 'aa'] },
		{ my: 'မန္တလေး', roman: 'man-da-lay:', en: 'Mandalay', parts: ['ma', 'na', 'ta', 'la', 'ay', 'visarga'] },
		{ my: 'သစ္စာ', roman: 'thit-sa', en: 'truth / loyalty', parts: ['tha', 'sa', 'aa'] },
		{ my: 'ဗုဒ္ဓ', roman: 'boke-da.', en: 'Buddha', parts: ['ba', 'u', 'da', 'dha'] },
		{ my: 'စက္ကူ', roman: 'set-ku', en: 'paper', parts: ['sa', 'ka', 'uu'] }
	]
};

// ── Decodable sentences (short, real, verb-final) ────────────────────
// Keyed by the unit after which they become readable: every glyph in a
// sentence has been taught by the end of that unit. Sentence audio is
// generated by scripts/generate-audio.ts on the next run.
export interface DecodableSentence {
	my: string;
	roman: string;
	en: string;
}

export const decodableSentences: Record<string, DecodableSentence[]> = {
	'killer-stroke': [
		{ my: 'ဒါ ရေ ပါ', roman: 'da yay ba', en: 'This is water.' },
		{ my: 'နေ ပူတယ်', roman: 'nay pu-deh', en: 'The sun is hot.' },
		{ my: 'ဒါ ဘာလဲ', roman: 'da ba-leh', en: 'What is this?' }
	],
	tones: [
		{ my: 'ငါ ထမင်း စားတယ်', roman: 'nga hta-min: sa:-deh', en: 'I eat rice.' },
		{ my: 'မီး ပူတယ်', roman: 'mi: pu-deh', en: 'The fire is hot.' },
		{ my: 'ငါး စားတယ်', roman: 'nga: sa:-deh', en: 'I eat fish.' }
	],
	blends: [
		{ my: 'မိုး ရွာတယ်', roman: 'mo: ywa-deh', en: 'It is raining.' },
		{ my: 'ငါ သွားမယ်', roman: 'nga thwa:-meh', en: 'I will go.' },
		{ my: 'ရေ ကူးတယ်', roman: 'yay ku:-deh', en: 'I swim.' }
	],
	digits: [
		{ my: 'နွားနို့ ဝယ်တယ်', roman: 'nwa:-no. weh-deh', en: 'I buy milk.' },
		{ my: 'ကား ၂ စီး လာတယ်', roman: 'ka: hnit si: la-deh', en: 'Two cars are coming.' }
	]
};

// ── Unit explainer notes (concept cards shown during intro lessons) ───
export interface UnitNote {
	title: string;
	body: string;
	examples?: { my: string; sub: string }[];
}

export const unitNotes: Record<string, UnitNote[]> = {
	stacked: [
		{
			title: 'Stacked letters — ပါဌ်ဆင့်',
			body: 'In words borrowed from Pali, one consonant is written directly UNDER another to save space. You already know both letters — the bottom one is just drawn small.',
			examples: [
				{ my: 'က္က', sub: 'က + က' },
				{ my: 'န္တ', sub: 'န + တ' },
				{ my: 'ဒ္ဓ', sub: 'ဒ + ဓ' }
			]
		},
		{
			title: 'How to read a stack',
			body: 'The TOP letter closes the syllable before it — as if it wore an invisible asat (်). The BOTTOM letter starts the next syllable.',
			examples: [{ my: 'ကမ္ဘာ', sub: 'က + မ် ‧ ဘာ → ka-ba “world”' }]
		},
		{
			title: 'Where you’ll meet them',
			body: 'Mostly in Pali loanwords: religion, scholarship, place names. မန္တလေး (Mandalay) and ကမ္ဘာ (world) are everyday sightings — once you spot stacks, they’re everywhere.'
		}
	]
};

// ── Teaching units ────────────────────────────────────────────────────
export interface ScriptUnit {
	id: string;
	title: string;
	blurb: string;
	glyphIds: string[];
	/** Hub icon override for units that introduce no single glyph. */
	icon?: string;
}

export const scriptUnits: ScriptUnit[] = [
	{
		id: 'first-letters',
		title: 'First letters',
		blurb: 'Four workhorse letters + your first vowel. Real words by the end.',
		glyphIds: ['ma', 'na', 'ka', 'a', 'aa']
	},
	{
		id: 'hooks-and-tails',
		title: 'Hooks & tails',
		blurb: 'Letters with hooks and hangers, plus the roof-circle vowels.',
		glyphIds: ['ta', 'nga', 'ra', 'la', 'i', 'ii']
	},
	{
		id: 'round-sounds',
		title: 'Round sounds',
		blurb: 'Coils and cups, plus the under-hooks u and ū.',
		glyphIds: ['sa', 'hsa', 'pa', 'bha', 'u', 'uu']
	},
	{
		id: 'open-circles',
		title: 'Open circles',
		blurb: 'The tricky open-circle family — and the vowel that jumps the queue.',
		glyphIds: ['kha', 'ga', 'da', 'wa', 'ay']
	},
	{
		id: 'twins-and-hats',
		title: 'Twins & hats',
		blurb: 'Aspirated twins, letters in hats, and the backward flick.',
		glyphIds: ['hta', 'hpa', 'ba', 'ya', 'eh']
	},
	{
		id: 'night-letters',
		title: 'Night letters',
		blurb: 'The last common consonants, and how i + u make “o”.',
		glyphIds: ['za', 'nya', 'tha', 'ha', 'io']
	},
	{
		id: 'killer-stroke',
		title: 'The killer stroke',
		blurb: 'Asat kills the vowel and closes syllables — reading levels up.',
		glyphIds: ['gha', 'dha', 'asat']
	},
	{
		id: 'tones',
		title: 'Tones',
		blurb: 'Two tiny marks, whole different words.',
		glyphIds: ['visarga', 'dot']
	},
	{
		id: 'blends',
		title: 'Blends',
		blurb: 'Medials: squeeze y, w and h into a letter.',
		glyphIds: ['yapin', 'yayit', 'wahswe', 'hahto']
	},
	{
		id: 'digits',
		title: 'Digits',
		blurb: 'Read prices, buses and phone numbers.',
		glyphIds: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9']
	},
	{
		id: 'stacked',
		title: 'Stacked letters',
		blurb: 'Pali stacks: one letter rides under another. Read Mandalay!',
		glyphIds: [],
		icon: 'က္က'
	}
];

export const scriptUnitById = new Map(scriptUnits.map((u) => [u.id, u]));

/** Total glyph count (for progress display). */
export const totalGlyphs = glyphs.length;
