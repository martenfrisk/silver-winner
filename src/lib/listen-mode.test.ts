import { describe, expect, it } from 'vitest';
import type { Exercise } from './data/course';
import { meaningFirst } from './listen-mode';
import { silentSafe } from './silent-mode';

type ListenEx = Extract<Exercise, { kind: 'listen' }>;

const GLOSS: Record<string, string> = {
	ရေ: 'Water',
	ကော်ဖီ: 'Coffee',
	လက်ဖက်ရည်: 'Tea'
};
const glossOf = (my: string) => GLOSS[my];

const listen = (o: Partial<ListenEx> = {}): ListenEx => ({
	kind: 'listen',
	my: 'ရေ',
	roman: 'yei',
	en: 'Water',
	options: [{ text: 'ရေ', sub: 'yei' }, { text: 'ကော်ဖီ' }, { text: 'လက်ဖက်ရည်' }],
	correct: 0,
	...o
});

describe('for a learner who reads the script', () => {
	it('swaps the script options for their meanings', () => {
		const ex = meaningFirst(listen(), true, glossOf) as ListenEx;
		expect(ex.optionLang).toBe('en');
		expect(ex.options.map((o) => o.text)).toEqual(['Water', 'Coffee', 'Tea']);
	});

	it('keeps the correct index, so grading is untouched', () => {
		// `en` tracks the correct option, per the invariant below.
		const ex = meaningFirst(listen({ correct: 2, my: 'လက်ဖက်ရည်', en: 'Tea' }), true, glossOf) as ListenEx;
		expect(ex.correct).toBe(2);
		expect(ex.options[2].text).toBe('Tea');
	});

	it('leaves the played word and its meaning alone', () => {
		const ex = meaningFirst(listen(), true, glossOf) as ListenEx;
		expect(ex.my).toBe('ရေ');
		expect(ex.en).toBe('Water');
	});

	it('does not mutate the authored exercise', () => {
		const original = listen();
		const before = JSON.stringify(original);
		meaningFirst(original, true, glossOf);
		expect(JSON.stringify(original)).toBe(before);
	});
});

describe('leaves a drill alone when swapping would make it worse', () => {
	it('does nothing for a learner who does not read the script', () => {
		expect(meaningFirst(listen(), false, glossOf)).toEqual(listen());
	});

	it('skips a drill that already asks for meaning', () => {
		const already = listen({ optionLang: 'en', options: [{ text: 'Water' }, { text: 'Tea' }] });
		expect(meaningFirst(already, true, glossOf)).toBe(already);
	});

	// The Burmese-digit drills: the options are numerals, not vocabulary, and
	// reading them is the skill being tested.
	it('skips a drill whose options have no English', () => {
		const digits = listen({ options: [{ text: '၂' }, { text: '၇' }, { text: '၄' }] });
		expect(meaningFirst(digits, true, glossOf)).toBe(digits);
	});

	it('skips a drill the content marked keepScript', () => {
		const particles = listen({ keepScript: true });
		expect(meaningFirst(particles, true, glossOf)).toBe(particles);
	});

	it('refuses to build near-synonym options out of a fair question', () => {
		const gloss = (my: string) =>
			({ a: 'See you', b: 'See you tomorrow', c: 'Take care' })[my];
		const ex = listen({ options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] });
		expect(meaningFirst(ex, true, gloss)).toBe(ex);
	});

	it('refuses when two options share one gloss', () => {
		const gloss = (my: string) => ({ a: 'Yes', b: 'Yes', c: 'No' })[my];
		const ex = listen({ options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }] });
		expect(meaningFirst(ex, true, gloss)).toBe(ex);
	});

	// ည is taught as a letter in the script unit and as "Night" in the time
	// unit, and the vocab index keeps whichever came first — so the "Night"
	// drill would have relabelled its own correct answer "The letter nya".
	it('refuses when the correct option glosses to something else', () => {
		const gloss = (my: string) =>
			({ ည: 'The letter “nya”', a: 'Evening', b: 'Noon' })[my];
		const ex = listen({
			my: 'ည',
			en: 'Night',
			options: [{ text: 'ည' }, { text: 'a' }, { text: 'b' }],
			correct: 0
		});
		expect(meaningFirst(ex, true, gloss)).toBe(ex);
	});

	it('passes non-listen exercises straight through', () => {
		const choice = { kind: 'choice', question: 'x', options: [], correct: 0 } as const;
		expect(meaningFirst(choice, true, glossOf)).toBe(choice);
	});
});

// The two transforms compose: meaning-first keeps it a listen drill, then
// silent mode may turn that into a reading drill. Order matters, and
// silentChoice already special-cases English options.
describe('composing with silent mode', () => {
	it('produces a meaning question when muted, not "which one says X"', () => {
		const converted = meaningFirst(listen(), true, glossOf);
		const silent = silentSafe(converted, false);
		expect(silent.kind).toBe('choice');
		expect(silent).toMatchObject({ question: 'What does this mean?', promptMy: 'ရေ' });
		expect(silent.options.map((o) => o.text)).toEqual(['Water', 'Coffee', 'Tea']);
	});

	it('still falls back to the reading drill for a beginner', () => {
		const silent = silentSafe(meaningFirst(listen(), false, glossOf), false);
		expect(silent).toMatchObject({ question: 'Which one says “Water”?' });
	});
});
