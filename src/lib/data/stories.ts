// Decodable stories: tiny dialogues built (almost) entirely from vocabulary
// the learner has already met in the course — comprehensible input, the thing
// drills can't provide. Each story unlocks once the lessons it draws from are
// completed; the odd new word is fine because every chunk is tap-to-gloss.
//
// Lines carry no sentence-final ။ so single-word lines reuse existing audio.

export interface StoryChunk {
	my: string;
	/** Gloss shown when the learner taps the chunk. */
	en: string;
	/** Marks a word the course hasn't taught yet (shown with a 🆕 dot). */
	isNew?: boolean;
}

export interface StoryLine {
	/** 'a' = Shwe (left), 'b' = the visitor Mimi (right). */
	speaker: 'a' | 'b';
	chunks: StoryChunk[];
	roman: string;
	/** Whole-line translation, revealed after the line is heard. */
	en: string;
}

export interface Story {
	id: string;
	title: string;
	emoji: string;
	blurb: string;
	/** Course lesson ids whose vocab the story uses — all must be completed. */
	requires: string[];
	lines: StoryLine[];
	/** One comprehension question at the end. */
	check: { question: string; options: string[]; correct: number };
}

/** A line's full Burmese text (chunks joined) — also its TTS/audio key. */
export function lineMy(line: StoryLine): string {
	return line.chunks.map((c) => c.my).join(' ');
}

export const stories: Story[] = [
	{
		id: 'hello-shwe',
		title: 'Hello, Shwe!',
		emoji: '👋',
		blurb: 'Your first real conversation',
		requires: ['first-words', 'how-are-you'],
		lines: [
			{
				speaker: 'a',
				chunks: [{ my: 'မင်္ဂလာပါ', en: 'hello' }],
				roman: 'min-ga-la-ba',
				en: 'Hello!'
			},
			{
				speaker: 'b',
				chunks: [
					{ my: 'မင်္ဂလာပါ', en: 'hello' },
					{ my: 'နေကောင်းလား', en: 'how are you?' }
				],
				roman: 'min-ga-la-ba, nei-kaung-la',
				en: 'Hello. How are you?'
			},
			{
				speaker: 'a',
				chunks: [
					{ my: 'နေကောင်းပါတယ်', en: 'I’m fine' },
					{ my: 'ကျေးဇူးတင်ပါတယ်', en: 'thank you' }
				],
				roman: 'nei-kaung-ba-deh, kyei-zu tin-ba-deh',
				en: 'I’m fine, thank you.'
			},
			{
				speaker: 'b',
				chunks: [{ my: 'တာ့တာ', en: 'bye!' }],
				roman: 'ta-ta',
				en: 'Bye!'
			}
		],
		check: {
			question: 'How is Shwe feeling?',
			options: ['Fine', 'Hungry', 'Sorry'],
			correct: 0
		}
	},
	{
		id: 'teashop',
		title: 'At the tea shop',
		emoji: '🍵',
		blurb: 'Order like a local',
		requires: ['tea-shop', 'ordering', 'burmese-digits'],
		lines: [
			{
				speaker: 'b',
				chunks: [
					{ my: 'မင်္ဂလာပါ', en: 'hello' },
					{ my: 'လက်ဖက်ရည်', en: 'tea (with milk)' },
					{ my: 'ပေးပါ', en: 'please give (me)' }
				],
				roman: 'min-ga-la-ba, la-hpet-yei pei-ba',
				en: 'Hello, tea please.'
			},
			{
				speaker: 'a',
				chunks: [{ my: 'ဟုတ်ကဲ့', en: 'yes / of course' }],
				roman: 'hote-kéh',
				en: 'Of course.'
			},
			{
				speaker: 'b',
				chunks: [{ my: 'ဘယ်လောက်လဲ', en: 'how much is it?' }],
				roman: 'beh-lauk-léh',
				en: 'How much is it?'
			},
			{
				speaker: 'a',
				chunks: [
					{ my: '၅၀၀', en: '500 (Myanmar digits)' },
					{ my: 'ပါ', en: '(polite ending)' }
				],
				roman: 'nga-ya ba',
				en: 'It’s 500.'
			},
			{
				speaker: 'b',
				chunks: [{ my: 'ကျေးဇူးတင်ပါတယ်', en: 'thank you' }],
				roman: 'kyei-zu tin-ba-deh',
				en: 'Thank you!'
			}
		],
		check: {
			question: 'What did Mimi order?',
			options: ['Tea (with milk)', 'Mohinga', 'Nothing'],
			correct: 0
		}
	},
	{
		id: 'pagoda',
		title: 'Where is the pagoda?',
		emoji: '🛕',
		blurb: 'Ask for directions',
		requires: ['polite-talk', 'where-is-it', 'left-and-right'],
		lines: [
			{
				speaker: 'b',
				chunks: [
					{ my: 'ဘုရား', en: 'pagoda' },
					{ my: 'ဘယ်မှာလဲ', en: 'where is…?' }
				],
				roman: 'hpa-ya beh-hma-léh',
				en: 'Where is the pagoda?'
			},
			{
				speaker: 'a',
				chunks: [
					{ my: 'ဘယ်ဘက်မှာ', en: 'on the left (မှာ = at)', isNew: true },
					{ my: 'ရှိတယ်', en: 'there is / it’s located' }
				],
				roman: 'beh-bet-hma shi-deh',
				en: 'It’s on the left.'
			},
			{
				speaker: 'b',
				chunks: [{ my: 'ကျေးဇူးတင်ပါတယ်', en: 'thank you' }],
				roman: 'kyei-zu tin-ba-deh',
				en: 'Thank you!'
			},
			{
				speaker: 'a',
				chunks: [{ my: 'ရပါတယ်', en: 'no problem' }],
				roman: 'ya-ba-deh',
				en: 'No problem.'
			}
		],
		check: {
			question: 'Where is the pagoda?',
			options: ['On the left', 'On the right', 'Far away'],
			correct: 0
		}
	}
];

export const storyById = new Map(stories.map((s) => [s.id, s]));

/** The stars-map key a story's completion is recorded under. */
export function storyStarsKey(storyId: string): string {
	return `story-${storyId}`;
}
