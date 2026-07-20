// One-line grammar tips shown at the point of error: when a learner misses an
// answer, the reveal card explains the single most relevant particle/pattern
// in the correct Burmese text. Explicit rules, one sentence, only on mistakes
// — the opposite of drowning beginners in a grammar chapter.

interface TipRule {
	/** Matches against the correct answer's Burmese text. */
	test: (my: string) => boolean;
	tip: string;
}

// Ordered: more specific patterns first — the first match wins.
const RULES: TipRule[] = [
	{
		// Negation wraps the verb: မ + verb + ဘူး.
		test: (my) => my.includes('မ') && my.includes('ဘူး'),
		tip: 'မ + verb + ဘူး wraps a verb to negate it: စားတယ် "eat" → မစားဘူး "don\'t eat".'
	},
	{
		test: (my) => my.endsWith('လား'),
		tip: 'Ending လား turns a statement into a yes/no question.'
	},
	{
		test: (my) => my.endsWith('လဲ') || my.endsWith('သလဲ'),
		tip: 'Ending လဲ marks a wh-question (what/where/who…).'
	},
	{
		test: (my) => my.includes('ချင်'),
		tip: 'Verb + ချင် = "want to": သွား "go" → သွားချင်တယ် "want to go".'
	},
	{
		test: (my) => my.endsWith('မယ်'),
		tip: 'Ending မယ် marks the future or an intention — "will / going to".'
	},
	{
		test: (my) => my.endsWith('ပြီ'),
		tip: 'Ending ပြီ signals "already / by now" — something has changed state.'
	},
	{
		test: (my) => my.includes('နေတယ်') || my.includes('နေပါတယ်'),
		tip: 'Verb + နေ = an ongoing action, like English "-ing".'
	},
	{
		test: (my) => my.endsWith('တယ်') || my.endsWith('ပါတယ်'),
		tip: 'Ending တယ် closes a plain statement (Burmese doesn\'t mark past vs present here).'
	},
	{
		test: (my) => my.endsWith('ပါ'),
		tip: 'ပါ softens the sentence — it makes requests and answers polite.'
	}
];

/** The one most relevant tip for this Burmese text, or null if no rule fits. */
export function grammarTip(my: string): string | null {
	for (const r of RULES) if (r.test(my)) return r.tip;
	return null;
}
