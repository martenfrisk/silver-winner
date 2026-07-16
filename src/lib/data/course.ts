// MyanLingo beginner course data.
// Romanization is a simplified phonetic scheme aimed at absolute beginners,
// not a strict MLC transcription.

export interface Option {
	text: string;
	sub?: string;
}

export type Exercise =
	| {
			kind: 'learn';
			my: string;
			roman: string;
			en: string;
			emoji?: string;
			note?: string;
	  }
	| {
			kind: 'choice';
			question: string;
			/** Big Burmese prompt shown above the options (speakable). */
			promptMy?: string;
			promptRoman?: string;
			options: Option[];
			correct: number;
	  }
	| {
			kind: 'match';
			pairs: { l: string; lSub?: string; r: string }[];
	  }
	| {
			kind: 'listen';
			/** The Burmese text that is played ("Tap what you hear"). Must have generated audio. */
			my: string;
			roman: string;
			/** English meaning, revealed after answering. */
			en: string;
			/** Burmese-script options; one of them is `my`. */
			options: Option[];
			correct: number;
	  }
	| {
			kind: 'assemble';
			question: string;
			/** Correct tiles in order. */
			answer: { t: string; sub?: string }[];
			/** Wrong tiles mixed into the bank. */
			extras: { t: string; sub?: string }[];
			/** Full sentence for TTS + the reveal. */
			my: string;
			roman: string;
	  };

export interface Lesson {
	id: string;
	title: string;
	emoji: string;
	exercises: Exercise[];
}

export interface Unit {
	id: string;
	title: string;
	my: string;
	color: string;
	lessons: Lesson[];
}

export const course: Unit[] = [
	{
		id: 'greetings',
		title: 'Greetings',
		my: 'နှုတ်ဆက်ခြင်း',
		color: 'var(--gold)',
		lessons: [
			{
				id: 'first-words',
				title: 'First words',
				emoji: '🙏',
				exercises: [
					{
						kind: 'learn',
						my: 'မင်္ဂလာပါ',
						roman: 'min-ga-la-ba',
						en: 'Hello',
						emoji: '👋',
						note: 'The all-purpose Burmese greeting — literally “auspiciousness to you”.'
					},
					{
						kind: 'choice',
						question: 'What does this mean?',
						promptMy: 'မင်္ဂလာပါ',
						promptRoman: 'min-ga-la-ba',
						options: [{ text: 'Hello' }, { text: 'Goodbye' }, { text: 'Thank you' }],
						correct: 0
					},
					{
						kind: 'learn',
						my: 'ကျေးဇူးတင်ပါတယ်',
						roman: 'kyei-zu tin-ba-deh',
						en: 'Thank you',
						emoji: '💛'
					},
					{
						kind: 'choice',
						question: 'How do you say “Thank you”?',
						options: [
							{ text: 'ကျေးဇူးတင်ပါတယ်', sub: 'kyei-zu tin-ba-deh' },
							{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' },
							{ text: 'တာ့တာ', sub: 'ta-ta' }
						],
						correct: 0
					},
					{
						kind: 'learn',
						my: 'ဟုတ်ကဲ့',
						roman: 'hote-kéh',
						en: 'Yes',
						emoji: '✅',
						note: 'The polite way to agree.'
					},
					{
						kind: 'learn',
						my: 'မဟုတ်ဘူး',
						roman: 'ma-hote-bu',
						en: 'No',
						emoji: '❌',
						note: 'မ (ma) + …ဘူး (bu) wraps around a verb to negate it.'
					},
					{
						kind: 'choice',
						question: 'What does this mean?',
						promptMy: 'မဟုတ်ဘူး',
						promptRoman: 'ma-hote-bu',
						options: [{ text: 'No' }, { text: 'Yes' }, { text: 'Hello' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ဟုတ်ကဲ့',
						roman: 'hote-kéh',
						en: 'Yes',
						options: [
							{ text: 'ဟုတ်ကဲ့', sub: 'hote-kéh' },
							{ text: 'မဟုတ်ဘူး', sub: 'ma-hote-bu' },
							{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'မင်္ဂလာပါ', lSub: 'min-ga-la-ba', r: 'Hello' },
							{ l: 'ကျေးဇူးတင်ပါတယ်', lSub: 'kyei-zu tin-ba-deh', r: 'Thank you' },
							{ l: 'ဟုတ်ကဲ့', lSub: 'hote-kéh', r: 'Yes' },
							{ l: 'မဟုတ်ဘူး', lSub: 'ma-hote-bu', r: 'No' }
						]
					}
				]
			},
			{
				id: 'how-are-you',
				title: 'How are you?',
				emoji: '💬',
				exercises: [
					{
						kind: 'learn',
						my: 'နေကောင်းလား',
						roman: 'nei-kaung-la',
						en: 'How are you?',
						emoji: '🙂',
						note: 'Literally “are you well?” — လား (la) turns a statement into a question.'
					},
					{
						kind: 'learn',
						my: 'နေကောင်းပါတယ်',
						roman: 'nei-kaung-ba-deh',
						en: 'I’m fine',
						emoji: '😊'
					},
					{
						kind: 'choice',
						question: 'Someone asks နေကောင်းလား. How do you reply “I’m fine”?',
						options: [
							{ text: 'နေကောင်းပါတယ်', sub: 'nei-kaung-ba-deh' },
							{ text: 'မဟုတ်ဘူး', sub: 'ma-hote-bu' },
							{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' }
						],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'နေကောင်းလား',
						roman: 'nei-kaung-la',
						en: 'How are you?',
						options: [
							{ text: 'နေကောင်းလား', sub: 'nei-kaung-la' },
							{ text: 'နေကောင်းပါတယ်', sub: 'nei-kaung-ba-deh' },
							{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' }
						],
						correct: 0
					},
					{
						kind: 'assemble',
						question: 'Build the sentence: “I’m fine”',
						answer: [
							{ t: 'နေ', sub: 'nei' },
							{ t: 'ကောင်း', sub: 'kaung' },
							{ t: 'ပါ', sub: 'ba' },
							{ t: 'တယ်', sub: 'deh' }
						],
						extras: [
							{ t: 'လား', sub: 'la' },
							{ t: 'ဘူး', sub: 'bu' }
						],
						my: 'နေကောင်းပါတယ်',
						roman: 'nei-kaung-ba-deh'
					},
					{
						kind: 'learn',
						my: 'တာ့တာ',
						roman: 'ta-ta',
						en: 'Bye!',
						emoji: '👋',
						note: 'Casual — perfect between friends.'
					},
					{
						kind: 'learn',
						my: 'တောင်းပန်ပါတယ်',
						roman: 'taung-ban-ba-deh',
						en: 'I’m sorry',
						emoji: '🙇'
					},
					{
						kind: 'choice',
						question: 'What does this mean?',
						promptMy: 'တောင်းပန်ပါတယ်',
						promptRoman: 'taung-ban-ba-deh',
						options: [{ text: 'I’m sorry' }, { text: 'Bye!' }, { text: 'How are you?' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'တာ့တာ',
						roman: 'ta-ta',
						en: 'Bye!',
						options: [
							{ text: 'တာ့တာ', sub: 'ta-ta' },
							{ text: 'တောင်းပန်ပါတယ်', sub: 'taung-ban-ba-deh' },
							{ text: 'ဟုတ်ကဲ့', sub: 'hote-kéh' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'နေကောင်းလား', lSub: 'nei-kaung-la', r: 'How are you?' },
							{ l: 'နေကောင်းပါတယ်', lSub: 'nei-kaung-ba-deh', r: 'I’m fine' },
							{ l: 'တာ့တာ', lSub: 'ta-ta', r: 'Bye!' },
							{ l: 'တောင်းပန်ပါတယ်', lSub: 'taung-ban-ba-deh', r: 'I’m sorry' }
						]
					}
				]
			},
			{
				id: 'polite-talk',
				title: 'Polite talk',
				emoji: '🤝',
				exercises: [
					{
						kind: 'learn',
						my: 'ကျွန်တော်',
						roman: 'kyun-daw',
						en: 'I (male speaker)',
						emoji: '🙋‍♂️',
						note: 'Burmese “I” depends on who is speaking.'
					},
					{
						kind: 'learn',
						my: 'ကျွန်မ',
						roman: 'kyun-ma',
						en: 'I (female speaker)',
						emoji: '🙋‍♀️'
					},
					{
						kind: 'choice',
						question: 'A woman says “I”. Which word does she use?',
						options: [
							{ text: 'ကျွန်မ', sub: 'kyun-ma' },
							{ text: 'ကျွန်တော်', sub: 'kyun-daw' },
							{ text: 'ဟုတ်ကဲ့', sub: 'hote-kéh' }
						],
						correct: 0
					},
					{
						kind: 'learn',
						my: 'နာမည်',
						roman: 'nan-meh',
						en: 'Name',
						emoji: '📛'
					},
					{
						kind: 'learn',
						my: 'ရပါတယ်',
						roman: 'ya-ba-deh',
						en: 'It’s okay / no problem',
						emoji: '👌',
						note: 'You will hear this constantly in Myanmar.'
					},
					{
						kind: 'choice',
						question: 'What does this mean?',
						promptMy: 'ရပါတယ်',
						promptRoman: 'ya-ba-deh',
						options: [{ text: 'It’s okay' }, { text: 'Name' }, { text: 'I (male)' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ကျွန်မ',
						roman: 'kyun-ma',
						en: 'I (female speaker)',
						options: [
							{ text: 'ကျွန်မ', sub: 'kyun-ma' },
							{ text: 'ကျွန်တော်', sub: 'kyun-daw' },
							{ text: 'နာမည်', sub: 'nan-meh' }
						],
						correct: 0
					},
					{
						kind: 'assemble',
						question: 'Build the phrase: “Thank you”',
						answer: [
							{ t: 'ကျေးဇူး', sub: 'kyei-zu' },
							{ t: 'တင်', sub: 'tin' },
							{ t: 'ပါ', sub: 'ba' },
							{ t: 'တယ်', sub: 'deh' }
						],
						extras: [
							{ t: 'နာမည်', sub: 'nan-meh' },
							{ t: 'လား', sub: 'la' }
						],
						my: 'ကျေးဇူးတင်ပါတယ်',
						roman: 'kyei-zu tin-ba-deh'
					},
					{
						kind: 'listen',
						my: 'ရပါတယ်',
						roman: 'ya-ba-deh',
						en: 'It’s okay / no problem',
						options: [
							{ text: 'ရပါတယ်', sub: 'ya-ba-deh' },
							{ text: 'နေကောင်းပါတယ်', sub: 'nei-kaung-ba-deh' },
							{ text: 'ကျေးဇူးတင်ပါတယ်', sub: 'kyei-zu tin-ba-deh' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'ကျွန်တော်', lSub: 'kyun-daw', r: 'I (male)' },
							{ l: 'ကျွန်မ', lSub: 'kyun-ma', r: 'I (female)' },
							{ l: 'နာမည်', lSub: 'nan-meh', r: 'Name' },
							{ l: 'ရပါတယ်', lSub: 'ya-ba-deh', r: 'It’s okay' }
						]
					}
				]
			}
		]
	},
	{
		id: 'numbers',
		title: 'Numbers',
		my: 'ဂဏန်းများ',
		color: 'var(--teal)',
		lessons: [
			{
				id: 'one-to-five',
				title: '1 to 5',
				emoji: '✋',
				exercises: [
					{ kind: 'learn', my: 'တစ်', roman: 'tit', en: 'One (1)', emoji: '1️⃣' },
					{ kind: 'learn', my: 'နှစ်', roman: 'hnit', en: 'Two (2)', emoji: '2️⃣' },
					{ kind: 'learn', my: 'သုံး', roman: 'thoun', en: 'Three (3)', emoji: '3️⃣' },
					{
						kind: 'choice',
						question: 'Which one is “two”?',
						options: [{ text: 'နှစ်' }, { text: 'တစ်' }, { text: 'သုံး' }],
						correct: 0
					},
					{ kind: 'learn', my: 'လေး', roman: 'lei', en: 'Four (4)', emoji: '4️⃣' },
					{ kind: 'learn', my: 'ငါး', roman: 'nga', en: 'Five (5)', emoji: '5️⃣', note: 'Fun fact: ငါး also means “fish”.' },
					{
						kind: 'choice',
						question: 'What number is this?',
						promptMy: 'လေး',
						promptRoman: 'lei',
						options: [{ text: '4' }, { text: '5' }, { text: '2' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'သုံး',
						roman: 'thoun',
						en: 'Three (3)',
						options: [
							{ text: 'သုံး', sub: 'thoun' },
							{ text: 'တစ်', sub: 'tit' },
							{ text: 'နှစ်', sub: 'hnit' },
							{ text: 'ငါး', sub: 'nga' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'တစ်', lSub: 'tit', r: '1' },
							{ l: 'နှစ်', lSub: 'hnit', r: '2' },
							{ l: 'သုံး', lSub: 'thoun', r: '3' },
							{ l: 'လေး', lSub: 'lei', r: '4' },
							{ l: 'ငါး', lSub: 'nga', r: '5' }
						]
					}
				]
			},
			{
				id: 'six-to-ten',
				title: '6 to 10',
				emoji: '🔟',
				exercises: [
					{ kind: 'learn', my: 'ခြောက်', roman: 'chauk', en: 'Six (6)', emoji: '6️⃣' },
					{ kind: 'learn', my: 'ခုနစ်', roman: 'khu-hnit', en: 'Seven (7)', emoji: '7️⃣' },
					{
						kind: 'choice',
						question: 'Which one is “six”?',
						options: [{ text: 'ခြောက်' }, { text: 'ခုနစ်' }, { text: 'ငါး' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ခုနစ်',
						roman: 'khu-hnit',
						en: 'Seven (7)',
						options: [
							{ text: 'ခုနစ်', sub: 'khu-hnit' },
							{ text: 'ခြောက်', sub: 'chauk' },
							{ text: 'ငါး', sub: 'nga' }
						],
						correct: 0
					},
					{ kind: 'learn', my: 'ရှစ်', roman: 'shit', en: 'Eight (8)', emoji: '8️⃣' },
					{ kind: 'learn', my: 'ကိုး', roman: 'kou', en: 'Nine (9)', emoji: '9️⃣' },
					{ kind: 'learn', my: 'ဆယ်', roman: 'hseh', en: 'Ten (10)', emoji: '🔟' },
					{
						kind: 'choice',
						question: 'What number is this?',
						promptMy: 'ကိုး',
						promptRoman: 'kou',
						options: [{ text: '9' }, { text: '8' }, { text: '10' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ဆယ်',
						roman: 'hseh',
						en: 'Ten (10)',
						options: [
							{ text: 'ဆယ်', sub: 'hseh' },
							{ text: 'ရှစ်', sub: 'shit' },
							{ text: 'ကိုး', sub: 'kou' },
							{ text: 'ခြောက်', sub: 'chauk' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'ခြောက်', lSub: 'chauk', r: '6' },
							{ l: 'ခုနစ်', lSub: 'khu-hnit', r: '7' },
							{ l: 'ရှစ်', lSub: 'shit', r: '8' },
							{ l: 'ကိုး', lSub: 'kou', r: '9' },
							{ l: 'ဆယ်', lSub: 'hseh', r: '10' }
						]
					}
				]
			},
			{
				id: 'burmese-digits',
				title: 'Burmese digits',
				emoji: '🔢',
				exercises: [
					{
						kind: 'learn',
						my: '၁ ၂ ၃',
						roman: 'tit, hnit, thoun',
						en: 'Myanmar has its own digits!',
						emoji: '✍️',
						note: 'You’ll see them on price tags, buses and license plates.'
					},
					{
						kind: 'choice',
						question: 'Which digit is “3”?',
						options: [{ text: '၃' }, { text: '၁' }, { text: '၇' }],
						correct: 0
					},
					{
						kind: 'choice',
						question: 'Which digit is “7”?',
						options: [{ text: '၇' }, { text: '၂' }, { text: '၄' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: '၂',
						roman: 'hnit',
						en: '2',
						options: [
							{ text: '၂', sub: 'hnit' },
							{ text: '၇', sub: 'khu-hnit' },
							{ text: '၄', sub: 'lei' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: '၁', r: '1' },
							{ l: '၂', r: '2' },
							{ l: '၃', r: '3' },
							{ l: '၄', r: '4' },
							{ l: '၅', r: '5' }
						]
					},
					{
						kind: 'match',
						pairs: [
							{ l: '၆', r: '6' },
							{ l: '၇', r: '7' },
							{ l: '၈', r: '8' },
							{ l: '၉', r: '9' },
							{ l: '၁၀', r: '10' }
						]
					},
					{
						kind: 'listen',
						my: '၉',
						roman: 'kou',
						en: '9',
						options: [
							{ text: '၉', sub: 'kou' },
							{ text: '၈', sub: 'shit' },
							{ text: '၆', sub: 'chauk' }
						],
						correct: 0
					},
					{
						kind: 'choice',
						question: 'A bus shows the number ၅၉. What line is it?',
						options: [{ text: '59' }, { text: '95' }, { text: '69' }],
						correct: 0
					}
				]
			}
		]
	},
	{
		id: 'script',
		title: 'The Script',
		my: 'အက္ခရာ',
		color: 'var(--plum)',
		lessons: [
			{
				id: 'ka-row',
				title: 'The Ka row',
				emoji: '🐔',
				exercises: [
					{
						kind: 'learn',
						my: 'က',
						roman: 'ka',
						en: 'The letter “ka”',
						emoji: '🐔',
						note: 'The first letter of the alphabet — ka-gyi (“big ka”). Burmese letters are built from circles.'
					},
					{
						kind: 'learn',
						my: 'ခ',
						roman: 'kha',
						en: 'The letter “kha”',
						emoji: '💨',
						note: 'An aspirated “k” — say it with a puff of air.'
					},
					{
						kind: 'choice',
						question: 'Which letter is “ka”?',
						options: [{ text: 'က' }, { text: 'ခ' }, { text: 'ဂ' }],
						correct: 0
					},
					{ kind: 'learn', my: 'ဂ', roman: 'ga', en: 'The letter “ga”', emoji: '🎸' },
					{ kind: 'learn', my: 'င', roman: 'nga', en: 'The letter “nga”', emoji: '🐟', note: 'Like the “ng” in “sing” — but it can start a word!' },
					{
						kind: 'choice',
						question: 'Which letter is “nga”?',
						options: [{ text: 'င' }, { text: 'က' }, { text: 'ဂ' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ခ',
						roman: 'kha',
						en: 'The letter “kha”',
						options: [
							{ text: 'ခ', sub: 'kha' },
							{ text: 'က', sub: 'ka' },
							{ text: 'ဂ', sub: 'ga' },
							{ text: 'င', sub: 'nga' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'က', r: 'ka' },
							{ l: 'ခ', r: 'kha' },
							{ l: 'ဂ', r: 'ga' },
							{ l: 'င', r: 'nga' }
						]
					}
				]
			},
			{
				id: 'sa-row',
				title: 'The Sa row',
				emoji: '🌀',
				exercises: [
					{ kind: 'learn', my: 'စ', roman: 'sa', en: 'The letter “sa”', emoji: '🌀' },
					{ kind: 'learn', my: 'ဆ', roman: 'hsa', en: 'The letter “hsa”', emoji: '🌬️', note: 'The aspirated twin of စ.' },
					{
						kind: 'choice',
						question: 'Which letter is “sa”?',
						options: [{ text: 'စ' }, { text: 'ဆ' }, { text: 'ဇ' }],
						correct: 0
					},
					{ kind: 'learn', my: 'ဇ', roman: 'za', en: 'The letter “za”', emoji: '⚡' },
					{ kind: 'learn', my: 'ည', roman: 'nya', en: 'The letter “nya”', emoji: '🌙', note: 'ည on its own also means “night”.' },
					{
						kind: 'choice',
						question: 'Which letter is “nya”?',
						options: [{ text: 'ည' }, { text: 'ဇ' }, { text: 'စ' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ည',
						roman: 'nya',
						en: 'The letter “nya”',
						options: [
							{ text: 'ည', sub: 'nya' },
							{ text: 'ဇ', sub: 'za' },
							{ text: 'စ', sub: 'sa' },
							{ text: 'ဆ', sub: 'hsa' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'စ', r: 'sa' },
							{ l: 'ဆ', r: 'hsa' },
							{ l: 'ဇ', r: 'za' },
							{ l: 'ည', r: 'nya' }
						]
					}
				]
			},
			{
				id: 'ta-pa-rows',
				title: 'Ta & Pa rows',
				emoji: '🥁',
				exercises: [
					{ kind: 'learn', my: 'တ', roman: 'ta', en: 'The letter “ta”', emoji: '🥁' },
					{ kind: 'learn', my: 'န', roman: 'na', en: 'The letter “na”', emoji: '👃' },
					{
						kind: 'choice',
						question: 'Which letter is “ta”?',
						options: [{ text: 'တ' }, { text: 'န' }, { text: 'ပ' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'န',
						roman: 'na',
						en: 'The letter “na”',
						options: [
							{ text: 'န', sub: 'na' },
							{ text: 'တ', sub: 'ta' },
							{ text: 'င', sub: 'nga' }
						],
						correct: 0
					},
					{ kind: 'learn', my: 'ပ', roman: 'pa', en: 'The letter “pa”', emoji: '🦜' },
					{ kind: 'learn', my: 'မ', roman: 'ma', en: 'The letter “ma”', emoji: '💜', note: 'You already know it from မင်္ဂလာပါ!' },
					{
						kind: 'choice',
						question: 'Which letter is “ma”?',
						options: [{ text: 'မ' }, { text: 'ပ' }, { text: 'တ' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'မ',
						roman: 'ma',
						en: 'The letter “ma”',
						options: [
							{ text: 'မ', sub: 'ma' },
							{ text: 'ပ', sub: 'pa' },
							{ text: 'န', sub: 'na' },
							{ text: 'တ', sub: 'ta' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'တ', r: 'ta' },
							{ l: 'န', r: 'na' },
							{ l: 'ပ', r: 'pa' },
							{ l: 'မ', r: 'ma' }
						]
					},
					{
						kind: 'choice',
						question: 'Spot the familiar letters: which word starts with မ (ma)?',
						options: [
							{ text: 'မင်္ဂလာပါ', sub: 'min-ga-la-ba' },
							{ text: 'ကျေးဇူး', sub: 'kyei-zu' },
							{ text: 'နေကောင်း', sub: 'nei-kaung' }
						],
						correct: 0
					}
				]
			}
		]
	},
	{
		id: 'food',
		title: 'Food & Drink',
		my: 'အစားအသောက်',
		color: 'var(--coral)',
		lessons: [
			{
				id: 'tea-shop',
				title: 'At the tea shop',
				emoji: '🍵',
				exercises: [
					{
						kind: 'learn',
						my: 'လက်ဖက်ရည်',
						roman: 'la-hpet-yei',
						en: 'Tea (with milk)',
						emoji: '🍵',
						note: 'Tea shops are the heart of Myanmar social life.'
					},
					{ kind: 'learn', my: 'ကော်ဖီ', roman: 'kaw-fi', en: 'Coffee', emoji: '☕', note: 'Sounds familiar? It’s a loanword.' },
					{
						kind: 'choice',
						question: 'What would you order?',
						promptMy: 'လက်ဖက်ရည်',
						promptRoman: 'la-hpet-yei',
						options: [{ text: 'Tea' }, { text: 'Coffee' }, { text: 'Water' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ကော်ဖီ',
						roman: 'kaw-fi',
						en: 'Coffee',
						options: [
							{ text: 'ကော်ဖီ', sub: 'kaw-fi' },
							{ text: 'လက်ဖက်ရည်', sub: 'la-hpet-yei' },
							{ text: 'ကျေးဇူးတင်ပါတယ်', sub: 'kyei-zu tin-ba-deh' }
						],
						correct: 0
					},
					{ kind: 'learn', my: 'ရေ', roman: 'yei', en: 'Water', emoji: '💧' },
					{ kind: 'learn', my: 'ထမင်း', roman: 'hta-min', en: 'Rice / a meal', emoji: '🍚', note: '“Have you eaten rice?” is a common way to say hi.' },
					{
						kind: 'choice',
						question: 'How do you say “water”?',
						options: [
							{ text: 'ရေ', sub: 'yei' },
							{ text: 'ထမင်း', sub: 'hta-min' },
							{ text: 'ကော်ဖီ', sub: 'kaw-fi' }
						],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ထမင်း',
						roman: 'hta-min',
						en: 'Rice / a meal',
						options: [
							{ text: 'ထမင်း', sub: 'hta-min' },
							{ text: 'ရေ', sub: 'yei' },
							{ text: 'လက်ဖက်ရည်', sub: 'la-hpet-yei' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'လက်ဖက်ရည်', lSub: 'la-hpet-yei', r: 'Tea' },
							{ l: 'ကော်ဖီ', lSub: 'kaw-fi', r: 'Coffee' },
							{ l: 'ရေ', lSub: 'yei', r: 'Water' },
							{ l: 'ထမင်း', lSub: 'hta-min', r: 'Rice' }
						]
					}
				]
			},
			{
				id: 'yummy',
				title: 'Yummy!',
				emoji: '😋',
				exercises: [
					{
						kind: 'learn',
						my: 'မုန့်ဟင်းခါး',
						roman: 'moun-hin-ga',
						en: 'Mohinga (fish noodle soup)',
						emoji: '🍜',
						note: 'Myanmar’s beloved national dish — breakfast of champions.'
					},
					{ kind: 'learn', my: 'ကောင်းတယ်', roman: 'kaung-deh', en: 'It’s good!', emoji: '👍' },
					{
						kind: 'choice',
						question: 'The mohinga is delicious. What do you say?',
						options: [
							{ text: 'ကောင်းတယ်', sub: 'kaung-deh' },
							{ text: 'မဟုတ်ဘူး', sub: 'ma-hote-bu' },
							{ text: 'တာ့တာ', sub: 'ta-ta' }
						],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'မုန့်ဟင်းခါး',
						roman: 'moun-hin-ga',
						en: 'Mohinga (fish noodle soup)',
						options: [
							{ text: 'မုန့်ဟင်းခါး', sub: 'moun-hin-ga' },
							{ text: 'လက်ဖက်ရည်', sub: 'la-hpet-yei' },
							{ text: 'ထမင်း', sub: 'hta-min' }
						],
						correct: 0
					},
					{ kind: 'learn', my: 'စားချင်တယ်', roman: 'sa-chin-deh', en: 'I want to eat', emoji: '🍽️', note: 'စား (eat) + ချင် (want) + တယ်.' },
					{ kind: 'learn', my: 'သောက်ချင်တယ်', roman: 'thauk-chin-deh', en: 'I want to drink', emoji: '🥤' },
					{
						kind: 'assemble',
						question: 'Build the sentence: “I want to drink tea”',
						answer: [
							{ t: 'လက်ဖက်ရည်', sub: 'la-hpet-yei' },
							{ t: 'သောက်', sub: 'thauk' },
							{ t: 'ချင်', sub: 'chin' },
							{ t: 'တယ်', sub: 'deh' }
						],
						extras: [
							{ t: 'စား', sub: 'sa' },
							{ t: 'ရေ', sub: 'yei' }
						],
						my: 'လက်ဖက်ရည် သောက်ချင်တယ်',
						roman: 'la-hpet-yei thauk-chin-deh'
					},
					{
						kind: 'assemble',
						question: 'Build the sentence: “I want to eat rice”',
						answer: [
							{ t: 'ထမင်း', sub: 'hta-min' },
							{ t: 'စား', sub: 'sa' },
							{ t: 'ချင်', sub: 'chin' },
							{ t: 'တယ်', sub: 'deh' }
						],
						extras: [
							{ t: 'သောက်', sub: 'thauk' },
							{ t: 'ကော်ဖီ', sub: 'kaw-fi' }
						],
						my: 'ထမင်း စားချင်တယ်',
						roman: 'hta-min sa-chin-deh'
					},
					{
						kind: 'listen',
						my: 'သောက်ချင်တယ်',
						roman: 'thauk-chin-deh',
						en: 'I want to drink',
						options: [
							{ text: 'သောက်ချင်တယ်', sub: 'thauk-chin-deh' },
							{ text: 'စားချင်တယ်', sub: 'sa-chin-deh' },
							{ text: 'ကောင်းတယ်', sub: 'kaung-deh' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'မုန့်ဟင်းခါး', lSub: 'moun-hin-ga', r: 'Mohinga' },
							{ l: 'ကောင်းတယ်', lSub: 'kaung-deh', r: 'It’s good' },
							{ l: 'စားချင်တယ်', lSub: 'sa-chin-deh', r: 'I want to eat' },
							{ l: 'သောက်ချင်တယ်', lSub: 'thauk-chin-deh', r: 'I want to drink' }
						]
					}
				]
			},
			{
				id: 'ordering',
				title: 'Ordering',
				emoji: '🧾',
				exercises: [
					{
						kind: 'learn',
						my: 'ပေးပါ',
						roman: 'pei-ba',
						en: 'Please give (me)…',
						emoji: '🤲',
						note: 'Put the thing you want before it: ရေ ပေးပါ = water, please.'
					},
					{
						kind: 'assemble',
						question: 'Build the sentence: “Water, please”',
						answer: [
							{ t: 'ရေ', sub: 'yei' },
							{ t: 'ပေး', sub: 'pei' },
							{ t: 'ပါ', sub: 'ba' }
						],
						extras: [
							{ t: 'စား', sub: 'sa' },
							{ t: 'တယ်', sub: 'deh' }
						],
						my: 'ရေ ပေးပါ',
						roman: 'yei pei-ba'
					},
					{
						kind: 'listen',
						my: 'ပေးပါ',
						roman: 'pei-ba',
						en: 'Please give (me)…',
						options: [
							{ text: 'ပေးပါ', sub: 'pei-ba' },
							{ text: 'ရပါတယ်', sub: 'ya-ba-deh' },
							{ text: 'တာ့တာ', sub: 'ta-ta' }
						],
						correct: 0
					},
					{
						kind: 'learn',
						my: 'ဘယ်လောက်လဲ',
						roman: 'beh-lauk-léh',
						en: 'How much is it?',
						emoji: '💰'
					},
					{
						kind: 'choice',
						question: 'You want the bill. What do you ask?',
						options: [
							{ text: 'ဘယ်လောက်လဲ', sub: 'beh-lauk-léh' },
							{ text: 'နေကောင်းလား', sub: 'nei-kaung-la' },
							{ text: 'ကောင်းတယ်', sub: 'kaung-deh' }
						],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ဘယ်လောက်လဲ',
						roman: 'beh-lauk-léh',
						en: 'How much is it?',
						options: [
							{ text: 'ဘယ်လောက်လဲ', sub: 'beh-lauk-léh' },
							{ text: 'ပေးပါ', sub: 'pei-ba' },
							{ text: 'ကောင်းတယ်', sub: 'kaung-deh' }
						],
						correct: 0
					},
					{
						kind: 'assemble',
						question: 'Build the sentence: “Coffee, please”',
						answer: [
							{ t: 'ကော်ဖီ', sub: 'kaw-fi' },
							{ t: 'ပေး', sub: 'pei' },
							{ t: 'ပါ', sub: 'ba' }
						],
						extras: [
							{ t: 'လက်ဖက်ရည်', sub: 'la-hpet-yei' },
							{ t: 'လဲ', sub: 'léh' }
						],
						my: 'ကော်ဖီ ပေးပါ',
						roman: 'kaw-fi pei-ba'
					},
					{
						kind: 'choice',
						question: 'The waiter says ရပါတယ် (ya-ba-deh). What do they mean?',
						options: [{ text: 'No problem!' }, { text: 'How much?' }, { text: 'Goodbye' }],
						correct: 0
					},
					{
						kind: 'listen',
						my: 'ရေ ပေးပါ',
						roman: 'yei pei-ba',
						en: 'Water, please',
						options: [
							{ text: 'ရေ ပေးပါ', sub: 'yei pei-ba' },
							{ text: 'ကော်ဖီ ပေးပါ', sub: 'kaw-fi pei-ba' },
							{ text: 'ဘယ်လောက်လဲ', sub: 'beh-lauk-léh' }
						],
						correct: 0
					},
					{
						kind: 'match',
						pairs: [
							{ l: 'ပေးပါ', lSub: 'pei-ba', r: 'Please give' },
							{ l: 'ဘယ်လောက်လဲ', lSub: 'beh-lauk-léh', r: 'How much?' },
							{ l: 'ကျေးဇူးတင်ပါတယ်', lSub: 'kyei-zu tin-ba-deh', r: 'Thank you' },
							{ l: 'ကောင်းတယ်', lSub: 'kaung-deh', r: 'It’s good' }
						]
					}
				]
			}
		]
	}
];

export const allLessons = course.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));

export function findLesson(id: string) {
	return allLessons.find((x) => x.lesson.id === id);
}

/** Flat ordered list of lesson ids, used for unlock order. */
export const lessonOrder = allLessons.map((x) => x.lesson.id);
