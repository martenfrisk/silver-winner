// MyanLingo beginner course data.
// Romanization is a simplified phonetic scheme aimed at absolute beginners,
// not a strict MLC transcription.

export interface Option {
  text: string;
  sub?: string;
}

/**
 * How deep into a lesson an exercise sits.
 *
 * Step 1 is the lesson proper — it alone gates the next lesson, so the path
 * never forces anyone through the extra material. Steps 2 and 3 add more
 * words on the same topic for learners who want them, and are entered from
 * the path node after step 1 is done.
 *
 * A flat tag rather than nested `steps[]` arrays on purpose: everything
 * downstream reads `lesson.exercises` flat (the linter, the audio generator,
 * the vocab index, the e2e tests), and a tag leaves every one of them working
 * untouched. Only the lesson player filters.
 */
export type LessonStep = 1 | 2 | 3;

export type ExerciseBody =
  | {
      kind: "learn";
      my: string;
      roman: string;
      en: string;
      emoji?: string;
      note?: string;
    }
  | {
      kind: "choice";
      question: string;
      /** Big Burmese prompt shown above the options (speakable). */
      promptMy?: string;
      promptRoman?: string;
      options: Option[];
      correct: number;
    }
  | {
      kind: "match";
      pairs: { l: string; lSub?: string; r: string }[];
    }
  | {
      kind: "listen";
      /** The Burmese text that is played ("Tap what you hear"). Must have generated audio. */
      my: string;
      roman: string;
      /** English meaning, revealed after answering. */
      en: string;
      /** One of them is the answer: `my` when optionLang is "my", `en` when "en". */
      options: Option[];
      correct: number;
      /**
       * What the options are written in. Default "my" — hear it, tap the
       * matching script.
       *
       * "en" makes it a comprehension drill instead: hear it, tap what it
       * means. Both directions matter, and the script one is weak at both ends
       * of the skill range — a learner who can't read is shape-matching, and
       * one who can read just decodes the options without ever needing the
       * meaning. Only the "en" form resists both shortcuts.
       */
      optionLang?: "my" | "en";
    }
  | {
      kind: "assemble";
      question: string;
      /** Correct tiles in order. */
      answer: { t: string; sub?: string }[];
      /** Wrong tiles mixed into the bank. */
      extras: { t: string; sub?: string }[];
      /** Full sentence for TTS + the reveal. */
      my: string;
      roman: string;
    };

/** An exercise, plus which step of its lesson it belongs to (default 1). */
export type Exercise = ExerciseBody & { step?: LessonStep };

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  exercises: Exercise[];
}

/** Steps a lesson actually has content for, ascending. Always includes 1. */
export function lessonSteps(lesson: Lesson): LessonStep[] {
  const present = new Set<LessonStep>([1]);
  for (const ex of lesson.exercises) if (ex.step) present.add(ex.step);
  return [...present].sort();
}

/** A lesson's exercises for one step. Untagged exercises are step 1. */
export function stepExercises(lesson: Lesson, step: LessonStep): Exercise[] {
  return lesson.exercises.filter((ex) => (ex.step ?? 1) === step);
}

/**
 * Where a step's stars live in `progress.stars`.
 *
 * Step 1 keeps the bare lesson id, so unlock order, crowns and every existing
 * saved profile keep working untouched. Deeper steps get a suffix the way the
 * reader track uses `reader-<unitId>`.
 */
export function stepStarsKey(lessonId: string, step: LessonStep): string {
  return step === 1 ? lessonId : `${lessonId}#${step}`;
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
    id: "greetings",
    title: "Greetings",
    my: "နှုတ်ဆက်ခြင်း",
    color: "var(--gold)",
    lessons: [
      {
        id: "first-words",
        title: "First words",
        emoji: "💬",
        exercises: [
          {
            kind: "learn",
            my: "မင်္ဂလာပါ",
            roman: "min-ga-la-ba",
            en: "Hello",
            emoji: "👋",
            note: "The all-purpose Burmese greeting, literally “auspiciousness to you”.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "မင်္ဂလာပါ",
            promptRoman: "min-ga-la-ba",
            options: [
              { text: "Hello" },
              { text: "Goodbye" },
              { text: "Thank you" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ကျေးဇူးတင်ပါတယ်",
            roman: "kyei-zu tin-ba-deh",
            en: "Thank you",
            emoji: "💛",
          },
          {
            kind: "choice",
            question: "How do you say “Thank you”?",
            options: [
              { text: "ကျေးဇူးတင်ပါတယ်", sub: "kyei-zu tin-ba-deh" },
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
              { text: "တာ့တာ", sub: "ta-ta" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဟုတ်ကဲ့",
            roman: "hote-kéh",
            en: "Yes",
            emoji: "✅",
            note: "The polite way to agree.",
          },
          {
            kind: "learn",
            my: "မဟုတ်ဘူး",
            roman: "ma-hote-bu",
            en: "No",
            emoji: "❌",
            note: "မ (ma) + …ဘူး (bu) wraps around a verb to negate it.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "မဟုတ်ဘူး",
            promptRoman: "ma-hote-bu",
            options: [{ text: "No" }, { text: "Yes" }, { text: "Hello" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဟုတ်ကဲ့",
            roman: "hote-kéh",
            en: "Yes",
            options: [
              { text: "ဟုတ်ကဲ့", sub: "hote-kéh" },
              { text: "မဟုတ်ဘူး", sub: "ma-hote-bu" },
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "မင်္ဂလာပါ", lSub: "min-ga-la-ba", r: "Hello" },
              {
                l: "ကျေးဇူးတင်ပါတယ်",
                lSub: "kyei-zu tin-ba-deh",
                r: "Thank you",
              },
              { l: "ဟုတ်ကဲ့", lSub: "hote-kéh", r: "Yes" },
              { l: "မဟုတ်ဘူး", lSub: "ma-hote-bu", r: "No" },
            ],
          },

          // ── Step 2: everyday replies ──────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ကျေးဇူးပဲ",
            roman: "kyei-zu-bèh",
            en: "Thanks",
            emoji: "🙏",
            note: "The short, casual cousin of ကျေးဇူးတင်ပါတယ် — friends, not strangers.",
          },
          {
            kind: "choice",
            step: 2,
            question: "Which one is the casual “Thanks”?",
            options: [
              { text: "ကျေးဇူးပဲ", sub: "kyei-zu-bèh" },
              { text: "ကျေးဇူးတင်ပါတယ်", sub: "kyei-zu tin-ba-deh" },
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "မသိဘူး",
            roman: "ma-thi-bu",
            en: "I don’t know",
            emoji: "🤷",
            note: "The same မ…ဘူး wrapper as မဟုတ်ဘူး, this time around သိ (thi, “know”).",
          },
          {
            kind: "listen",
            step: 2,
            my: "မသိဘူး",
            roman: "ma-thi-bu",
            en: "I don’t know",
            options: [
              { text: "မသိဘူး", sub: "ma-thi-bu" },
              { text: "မဟုတ်ဘူး", sub: "ma-hote-bu" },
              { text: "ဟုတ်ကဲ့", sub: "hote-kéh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "ဒါဘာလဲ",
            roman: "da ba-lèh",
            en: "What is this?",
            emoji: "❓",
            note: "ဒါ (da) “this” + ဘာ (ba) “what” + လဲ, the question particle for open questions.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဟုတ်လား",
            roman: "hote-lá",
            en: "Really?",
            emoji: "😮",
            note: "ဟုတ် “be so” + လား, the particle that makes a yes/no question.",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "ဟုတ်လား",
            promptRoman: "hote-lá",
            options: [
              { text: "Really?" },
              { text: "What is this?" },
              { text: "I don’t know" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ဒါဘာလဲ",
            roman: "da ba-lèh",
            en: "What is this?",
            options: [
              { text: "ဒါဘာလဲ", sub: "da ba-lèh" },
              { text: "ဟုတ်လား", sub: "hote-lá" },
              { text: "ကျေးဇူးပဲ", sub: "kyei-zu-bèh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ကျေးဇူးပဲ", lSub: "kyei-zu-bèh", r: "Thanks" },
              { l: "မသိဘူး", lSub: "ma-thi-bu", r: "I don’t know" },
              { l: "ဒါဘာလဲ", lSub: "da ba-lèh", r: "What is this?" },
              { l: "ဟုတ်လား", lSub: "hote-lá", r: "Really?" },
            ],
          },

          // ── Step 3: saying it politely ────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ခင်ဗျာ",
            roman: "khin-bya",
            en: "(polite particle, male speaker)",
            emoji: "🎩",
            note: "Tacked onto the end of what you say. A man says ခင်ဗျာ; a woman says ရှင်.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ရှင်",
            roman: "shin",
            en: "(polite particle, female speaker)",
            emoji: "🌸",
            note: "The counterpart to ခင်ဗျာ. Which one you use depends on who is speaking, not who you’re speaking to.",
          },
          {
            kind: "choice",
            step: 3,
            question: "A woman is speaking politely. Which ending does she use?",
            options: [
              { text: "ရှင်", sub: "shin" },
              { text: "ခင်ဗျာ", sub: "khin-bya" },
              { text: "ဘာလဲ", sub: "ba-lèh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 3,
            my: "မင်္ဂလာပါ ခင်ဗျာ",
            roman: "min-ga-la-ba khin-bya",
            en: "Hello (said by a man)",
            emoji: "👋",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်သူလဲ",
            roman: "bèh-thu-lèh",
            en: "Who is it?",
            emoji: "🕵️",
            note: "Same လဲ ending as ဒါဘာလဲ — open questions all take it.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဘယ်သူလဲ",
            roman: "bèh-thu-lèh",
            en: "Who is it?",
            options: [
              { text: "ဘယ်သူလဲ", sub: "bèh-thu-lèh" },
              { text: "ဒါဘာလဲ", sub: "da ba-lèh" },
              { text: "မသိဘူး", sub: "ma-thi-bu" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “Hello (said by a man)”",
            // Chunked by word, not syllable: the whole point of this drill is
            // attaching the politeness particle to a greeting the learner
            // already knows, not respelling မင်္ဂလာပါ.
            answer: [{ t: "မင်္ဂလာပါ" }, { t: "ခင်ဗျာ" }],
            extras: [{ t: "ရှင်" }, { t: "ဘယ်သူလဲ" }],
            my: "မင်္ဂလာပါ ခင်ဗျာ",
            roman: "min-ga-la-ba khin-bya",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ခင်ဗျာ", lSub: "khin-bya", r: "polite (man speaking)" },
              { l: "ရှင်", lSub: "shin", r: "polite (woman speaking)" },
              { l: "ဘယ်သူလဲ", lSub: "bèh-thu-lèh", r: "Who is it?" },
              { l: "ဒါဘာလဲ", lSub: "da ba-lèh", r: "What is this?" },
            ],
          },
        ],
      },
      {
        id: "how-are-you",
        title: "How are you?",
        emoji: "💬",
        exercises: [
          {
            kind: "learn",
            my: "နေကောင်းလား",
            roman: "nei-kaung-la",
            en: "How are you?",
            emoji: "🙂",
            note: "Literally “are you well?” The particle လား (la) turns a statement into a question.",
          },
          {
            kind: "learn",
            my: "နေကောင်းပါတယ်",
            roman: "nei-kaung-ba-deh",
            en: "I’m fine",
            emoji: "😊",
          },
          {
            kind: "choice",
            question: "Someone asks နေကောင်းလား. How do you reply “I’m fine”?",
            options: [
              { text: "နေကောင်းပါတယ်", sub: "nei-kaung-ba-deh" },
              { text: "မဟုတ်ဘူး", sub: "ma-hote-bu" },
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "နေကောင်းလား",
            roman: "nei-kaung-la",
            en: "How are you?",
            options: [
              { text: "နေကောင်းလား", sub: "nei-kaung-la" },
              { text: "နေကောင်းပါတယ်", sub: "nei-kaung-ba-deh" },
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build the sentence: “I’m fine”",
            answer: [
              { t: "နေကောင်း", sub: "nei-kaung" },
              { t: "ပါ", sub: "ba" },
              { t: "တယ်", sub: "deh" },
            ],
            extras: [
              { t: "လား", sub: "la" },
              { t: "ဘူး", sub: "bu" },
            ],
            my: "နေကောင်းပါတယ်",
            roman: "nei-kaung-ba-deh",
          },
          {
            kind: "learn",
            my: "တာ့တာ",
            roman: "ta-ta",
            en: "Bye!",
            emoji: "👋",
            note: "Casual, and perfect between friends.",
          },
          {
            kind: "learn",
            my: "တောင်းပန်ပါတယ်",
            roman: "taung-ban-ba-deh",
            en: "I’m sorry",
            emoji: "🙇",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "တောင်းပန်ပါတယ်",
            promptRoman: "taung-ban-ba-deh",
            options: [
              { text: "I’m sorry" },
              { text: "Bye!" },
              { text: "How are you?" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "တာ့တာ",
            roman: "ta-ta",
            en: "Bye!",
            options: [
              { text: "တာ့တာ", sub: "ta-ta" },
              { text: "တောင်းပန်ပါတယ်", sub: "taung-ban-ba-deh" },
              { text: "ဟုတ်ကဲ့", sub: "hote-kéh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "နေကောင်းလား", lSub: "nei-kaung-la", r: "How are you?" },
              { l: "နေကောင်းပါတယ်", lSub: "nei-kaung-ba-deh", r: "I’m fine" },
              { l: "တာ့တာ", lSub: "ta-ta", r: "Bye!" },
              { l: "တောင်းပန်ပါတယ်", lSub: "taung-ban-ba-deh", r: "I’m sorry" },
            ],
          },
        ],
      },
      {
        id: "polite-talk",
        title: "Polite talk",
        emoji: "🤝",
        exercises: [
          {
            kind: "learn",
            my: "ကျွန်တော်",
            roman: "kyun-daw",
            en: "I (male speaker)",
            emoji: "🙋‍♂️",
            note: "Burmese “I” depends on who is speaking.",
          },
          {
            kind: "learn",
            my: "ကျွန်မ",
            roman: "kyun-ma",
            en: "I (female speaker)",
            emoji: "🙋‍♀️",
          },
          {
            kind: "choice",
            question: "A woman says “I”. Which word does she use?",
            options: [
              { text: "ကျွန်မ", sub: "kyun-ma" },
              { text: "ကျွန်တော်", sub: "kyun-daw" },
              { text: "ဟုတ်ကဲ့", sub: "hote-kéh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "နာမည်",
            roman: "nan-meh",
            en: "Name",
            emoji: "📛",
          },
          {
            kind: "learn",
            my: "ရပါတယ်",
            roman: "ya-ba-deh",
            en: "It’s okay / no problem",
            emoji: "👌",
            note: "You will hear this constantly in Myanmar.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ရပါတယ်",
            promptRoman: "ya-ba-deh",
            options: [
              { text: "It’s okay" },
              { text: "Name" },
              { text: "I (male)" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ကျွန်မ",
            roman: "kyun-ma",
            en: "I (female speaker)",
            options: [
              { text: "ကျွန်မ", sub: "kyun-ma" },
              { text: "ကျွန်တော်", sub: "kyun-daw" },
              { text: "နာမည်", sub: "nan-meh" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build the phrase: “Thank you”",
            answer: [
              { t: "ကျေးဇူးတင်", sub: "kyei-zu tin" },
              { t: "ပါ", sub: "ba" },
              { t: "တယ်", sub: "deh" },
            ],
            extras: [
              { t: "နာမည်", sub: "nan-meh" },
              { t: "လား", sub: "la" },
            ],
            my: "ကျေးဇူးတင်ပါတယ်",
            roman: "kyei-zu tin-ba-deh",
          },
          {
            kind: "listen",
            my: "ရပါတယ်",
            roman: "ya-ba-deh",
            en: "It’s okay / no problem",
            options: [
              { text: "ရပါတယ်", sub: "ya-ba-deh" },
              { text: "နေကောင်းပါတယ်", sub: "nei-kaung-ba-deh" },
              { text: "ကျေးဇူးတင်ပါတယ်", sub: "kyei-zu tin-ba-deh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ကျွန်တော်", lSub: "kyun-daw", r: "I (male)" },
              { l: "ကျွန်မ", lSub: "kyun-ma", r: "I (female)" },
              { l: "နာမည်", lSub: "nan-meh", r: "Name" },
              { l: "ရပါတယ်", lSub: "ya-ba-deh", r: "It’s okay" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "numbers",
    title: "Numbers",
    my: "ဂဏန်းများ",
    color: "var(--teal)",
    lessons: [
      {
        id: "one-to-five",
        title: "1 to 5",
        emoji: "✋",
        exercises: [
          {
            kind: "learn",
            my: "တစ်",
            roman: "tit",
            en: "One (1)",
            emoji: "1️⃣",
          },
          {
            kind: "learn",
            my: "နှစ်",
            roman: "hnit",
            en: "Two (2)",
            emoji: "2️⃣",
          },
          {
            kind: "learn",
            my: "သုံး",
            roman: "thoun",
            en: "Three (3)",
            emoji: "3️⃣",
          },
          {
            kind: "choice",
            question: "Which one is “two”?",
            options: [{ text: "နှစ်" }, { text: "တစ်" }, { text: "သုံး" }],
            correct: 0,
          },
          {
            kind: "learn",
            my: "လေး",
            roman: "lei",
            en: "Four (4)",
            emoji: "4️⃣",
          },
          {
            kind: "learn",
            my: "ငါး",
            roman: "nga",
            en: "Five (5)",
            emoji: "5️⃣",
            note: "Fun fact: ငါး also means “fish”.",
          },
          {
            kind: "choice",
            question: "What number is this?",
            promptMy: "လေး",
            promptRoman: "lei",
            options: [{ text: "4" }, { text: "5" }, { text: "2" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "သုံး",
            roman: "thoun",
            en: "Three (3)",
            options: [
              { text: "သုံး", sub: "thoun" },
              { text: "တစ်", sub: "tit" },
              { text: "နှစ်", sub: "hnit" },
              { text: "ငါး", sub: "nga" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "တစ်", lSub: "tit", r: "1" },
              { l: "နှစ်", lSub: "hnit", r: "2" },
              { l: "သုံး", lSub: "thoun", r: "3" },
              { l: "လေး", lSub: "lei", r: "4" },
              { l: "ငါး", lSub: "nga", r: "5" },
            ],
          },
        ],
      },
      {
        id: "six-to-ten",
        title: "6 to 10",
        emoji: "🔟",
        exercises: [
          {
            kind: "learn",
            my: "ခြောက်",
            roman: "chauk",
            en: "Six (6)",
            emoji: "6️⃣",
          },
          {
            kind: "learn",
            my: "ခုနစ်",
            roman: "khu-hnit",
            en: "Seven (7)",
            emoji: "7️⃣",
          },
          {
            kind: "choice",
            question: "Which one is “six”?",
            options: [{ text: "ခြောက်" }, { text: "ခုနစ်" }, { text: "ငါး" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ခုနစ်",
            roman: "khu-hnit",
            en: "Seven (7)",
            options: [
              { text: "ခုနစ်", sub: "khu-hnit" },
              { text: "ခြောက်", sub: "chauk" },
              { text: "ငါး", sub: "nga" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ရှစ်",
            roman: "shit",
            en: "Eight (8)",
            emoji: "8️⃣",
          },
          {
            kind: "learn",
            my: "ကိုး",
            roman: "kou",
            en: "Nine (9)",
            emoji: "9️⃣",
          },
          {
            kind: "learn",
            my: "ဆယ်",
            roman: "hseh",
            en: "Ten (10)",
            emoji: "🔟",
          },
          {
            kind: "choice",
            question: "What number is this?",
            promptMy: "ကိုး",
            promptRoman: "kou",
            options: [{ text: "9" }, { text: "8" }, { text: "10" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဆယ်",
            roman: "hseh",
            en: "Ten (10)",
            options: [
              { text: "ဆယ်", sub: "hseh" },
              { text: "ရှစ်", sub: "shit" },
              { text: "ကိုး", sub: "kou" },
              { text: "ခြောက်", sub: "chauk" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ခြောက်", lSub: "chauk", r: "6" },
              { l: "ခုနစ်", lSub: "khu-hnit", r: "7" },
              { l: "ရှစ်", lSub: "shit", r: "8" },
              { l: "ကိုး", lSub: "kou", r: "9" },
              { l: "ဆယ်", lSub: "hseh", r: "10" },
            ],
          },
        ],
      },
      {
        id: "burmese-digits",
        title: "Burmese digits",
        emoji: "🔢",
        exercises: [
          {
            kind: "learn",
            my: "၁ ၂ ၃",
            roman: "tit, hnit, thoun",
            en: "1 2 3",
            emoji: "✍️",
            note: "You’ll see them on price tags, buses and license plates.",
          },
          {
            kind: "choice",
            question: "Which digit is “3”?",
            options: [{ text: "၃" }, { text: "၁" }, { text: "၇" }],
            correct: 0,
          },
          {
            kind: "choice",
            question: "Which digit is “7”?",
            options: [{ text: "၇" }, { text: "၂" }, { text: "၄" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "၂",
            roman: "hnit",
            en: "2",
            options: [
              { text: "၂", sub: "hnit" },
              { text: "၇", sub: "khu-hnit" },
              { text: "၄", sub: "lei" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "၁", r: "1" },
              { l: "၂", r: "2" },
              { l: "၃", r: "3" },
              { l: "၄", r: "4" },
              { l: "၅", r: "5" },
            ],
          },
          {
            kind: "match",
            pairs: [
              { l: "၆", r: "6" },
              { l: "၇", r: "7" },
              { l: "၈", r: "8" },
              { l: "၉", r: "9" },
              { l: "၁၀", r: "10" },
            ],
          },
          {
            kind: "listen",
            my: "၉",
            roman: "kou",
            en: "9",
            options: [
              { text: "၉", sub: "kou" },
              { text: "၈", sub: "shit" },
              { text: "၆", sub: "chauk" },
            ],
            correct: 0,
          },
          {
            kind: "choice",
            question: "A bus shows the number ၅၉. What line is it?",
            options: [{ text: "59" }, { text: "95" }, { text: "69" }],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    id: "script",
    title: "The Script",
    my: "အက္ခရာ",
    color: "var(--plum)",
    lessons: [
      {
        id: "ka-row",
        title: "The Ka row",
        emoji: "🐔",
        exercises: [
          {
            kind: "learn",
            my: "က",
            roman: "ka",
            en: "The letter “ka”",
            note: "The first letter of the alphabet, ka-gyi (“big ka”). Burmese letters are built from circles.",
          },
          {
            kind: "learn",
            my: "ခ",
            roman: "kha",
            en: "The letter “kha”",
            note: "An aspirated “k”. Say it with a puff of air.",
          },
          // Audio-first, never "which letter is 'ka'?": asking by romanization
          // teaches the letter as a spelling of a Latin syllable, and that
          // detour is exactly what a reader has to unlearn later.
          {
            kind: "listen",
            my: "က",
            roman: "ka",
            en: "The letter “ka”",
            options: [
              { text: "က", sub: "ka" },
              { text: "ခ", sub: "kha" },
              { text: "ဂ", sub: "ga" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဂ",
            roman: "ga",
            en: "The letter “ga”",
          },
          {
            kind: "learn",
            my: "င",
            roman: "nga",
            en: "The letter “nga”",
            note: "Like the “ng” in “sing”, but it can start a word!",
          },
          {
            kind: "listen",
            my: "င",
            roman: "nga",
            en: "The letter “nga”",
            options: [
              { text: "င", sub: "nga" },
              { text: "က", sub: "ka" },
              { text: "ဂ", sub: "ga" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ခ",
            roman: "kha",
            en: "The letter “kha”",
            options: [
              { text: "ခ", sub: "kha" },
              { text: "က", sub: "ka" },
              { text: "ဂ", sub: "ga" },
              { text: "င", sub: "nga" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "က", r: "ka" },
              { l: "ခ", r: "kha" },
              { l: "ဂ", r: "ga" },
              { l: "င", r: "nga" },
            ],
          },
        ],
      },
      {
        id: "sa-row",
        title: "The Sa row",
        emoji: "🌀",
        exercises: [
          {
            kind: "learn",
            my: "စ",
            roman: "sa",
            en: "The letter “sa”",
          },
          {
            kind: "learn",
            my: "ဆ",
            roman: "hsa",
            en: "The letter “hsa”",
            note: "The aspirated twin of စ.",
          },
          {
            kind: "listen",
            my: "စ",
            roman: "sa",
            en: "The letter “sa”",
            options: [
              { text: "စ", sub: "sa" },
              { text: "ဆ", sub: "hsa" },
              { text: "ဇ", sub: "za" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဇ",
            roman: "za",
            en: "The letter “za”",
          },
          {
            kind: "learn",
            my: "ည",
            roman: "nya",
            en: "The letter “nya”",
            note: "ည on its own also means “night”.",
          },
          {
            kind: "choice",
            question: "Which letter also means “night” on its own?",
            options: [{ text: "ည" }, { text: "ဇ" }, { text: "စ" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ည",
            roman: "nya",
            en: "The letter “nya”",
            options: [
              { text: "ည", sub: "nya" },
              { text: "ဇ", sub: "za" },
              { text: "စ", sub: "sa" },
              { text: "ဆ", sub: "hsa" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "စ", r: "sa" },
              { l: "ဆ", r: "hsa" },
              { l: "ဇ", r: "za" },
              { l: "ည", r: "nya" },
            ],
          },
        ],
      },
      {
        id: "ta-pa-rows",
        title: "Ta & Pa rows",
        emoji: "🥁",
        exercises: [
          {
            kind: "learn",
            my: "တ",
            roman: "ta",
            en: "The letter “ta”",
          },
          {
            kind: "learn",
            my: "န",
            roman: "na",
            en: "The letter “na”",
          },
          {
            kind: "listen",
            my: "တ",
            roman: "ta",
            en: "The letter “ta”",
            options: [
              { text: "တ", sub: "ta" },
              { text: "န", sub: "na" },
              { text: "ပ", sub: "pa" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "န",
            roman: "na",
            en: "The letter “na”",
            options: [
              { text: "န", sub: "na" },
              { text: "တ", sub: "ta" },
              { text: "င", sub: "nga" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ပ",
            roman: "pa",
            en: "The letter “pa”",
          },
          {
            kind: "learn",
            my: "မ",
            roman: "ma",
            en: "The letter “ma”",
            note: "You already know it from မင်္ဂလာပါ!",
          },
          {
            kind: "listen",
            my: "ပ",
            roman: "pa",
            en: "The letter “pa”",
            options: [
              { text: "ပ", sub: "pa" },
              { text: "မ", sub: "ma" },
              { text: "တ", sub: "ta" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "မ",
            roman: "ma",
            en: "The letter “ma”",
            options: [
              { text: "မ", sub: "ma" },
              { text: "ပ", sub: "pa" },
              { text: "န", sub: "na" },
              { text: "တ", sub: "ta" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "တ", r: "ta" },
              { l: "န", r: "na" },
              { l: "ပ", r: "pa" },
              { l: "မ", r: "ma" },
            ],
          },
          {
            kind: "choice",
            question: "Spot the familiar letters: which word starts with မ?",
            options: [
              { text: "မင်္ဂလာပါ", sub: "min-ga-la-ba" },
              { text: "ကျေးဇူး", sub: "kyei-zu" },
              { text: "နေကောင်း", sub: "nei-kaung" },
            ],
            correct: 0,
          },
        ],
      },
    ],
  },
  {
    id: "food",
    title: "Food & Drink",
    my: "အစားအသောက်",
    color: "var(--coral)",
    lessons: [
      {
        id: "tea-shop",
        title: "At the tea shop",
        emoji: "🍵",
        exercises: [
          {
            kind: "learn",
            my: "လက်ဖက်ရည်",
            roman: "la-hpet-yei",
            en: "Tea (with milk)",
            emoji: "🍵",
            note: "Tea shops are the heart of Myanmar social life.",
          },
          {
            kind: "learn",
            my: "ကော်ဖီ",
            roman: "kaw-fi",
            en: "Coffee",
            emoji: "☕",
            note: "Sounds familiar? It’s a loanword.",
          },
          {
            kind: "choice",
            question: "What would you order?",
            promptMy: "လက်ဖက်ရည်",
            promptRoman: "la-hpet-yei",
            options: [{ text: "Tea" }, { text: "Coffee" }, { text: "Water" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ကော်ဖီ",
            roman: "kaw-fi",
            en: "Coffee",
            options: [
              { text: "ကော်ဖီ", sub: "kaw-fi" },
              { text: "လက်ဖက်ရည်", sub: "la-hpet-yei" },
              { text: "ကျေးဇူးတင်ပါတယ်", sub: "kyei-zu tin-ba-deh" },
            ],
            correct: 0,
          },
          { kind: "learn", my: "ရေ", roman: "yei", en: "Water", emoji: "💧" },
          {
            kind: "learn",
            my: "ထမင်း",
            roman: "hta-min",
            en: "Rice / a meal",
            emoji: "🍚",
            note: "“Have you eaten rice?” is a common way to say hi.",
          },
          {
            kind: "choice",
            question: "How do you say “water”?",
            options: [
              { text: "ရေ", sub: "yei" },
              { text: "ထမင်း", sub: "hta-min" },
              { text: "ကော်ဖီ", sub: "kaw-fi" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ထမင်း",
            roman: "hta-min",
            en: "Rice / a meal",
            options: [
              { text: "ထမင်း", sub: "hta-min" },
              { text: "ရေ", sub: "yei" },
              { text: "လက်ဖက်ရည်", sub: "la-hpet-yei" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "လက်ဖက်ရည်", lSub: "la-hpet-yei", r: "Tea" },
              { l: "ကော်ဖီ", lSub: "kaw-fi", r: "Coffee" },
              { l: "ရေ", lSub: "yei", r: "Water" },
              { l: "ထမင်း", lSub: "hta-min", r: "Rice" },
            ],
          },
        ],
      },
      {
        id: "yummy",
        title: "Yummy!",
        emoji: "😋",
        exercises: [
          {
            kind: "learn",
            my: "မုန့်ဟင်းခါး",
            roman: "moun-hin-ga",
            en: "Mohinga (fish noodle soup)",
            emoji: "🍜",
            note: "Myanmar’s beloved national dish, the breakfast of champions.",
          },
          {
            kind: "learn",
            my: "ကောင်းတယ်",
            roman: "kaung-deh",
            en: "It’s good!",
            emoji: "👍",
          },
          {
            kind: "choice",
            question: "The mohinga is delicious. What do you say?",
            options: [
              { text: "ကောင်းတယ်", sub: "kaung-deh" },
              { text: "မဟုတ်ဘူး", sub: "ma-hote-bu" },
              { text: "တာ့တာ", sub: "ta-ta" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "မုန့်ဟင်းခါး",
            roman: "moun-hin-ga",
            en: "Mohinga (fish noodle soup)",
            options: [
              { text: "မုန့်ဟင်းခါး", sub: "moun-hin-ga" },
              { text: "လက်ဖက်ရည်", sub: "la-hpet-yei" },
              { text: "ထမင်း", sub: "hta-min" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "စားချင်တယ်",
            roman: "sa-chin-deh",
            en: "I want to eat",
            emoji: "🍽️",
            note: "စား (eat) + ချင် (want) + တယ်.",
          },
          {
            kind: "learn",
            my: "သောက်ချင်တယ်",
            roman: "thauk-chin-deh",
            en: "I want to drink",
            emoji: "🥤",
          },
          {
            kind: "assemble",
            question: "Build the sentence: “I want to drink tea”",
            answer: [
              { t: "လက်ဖက်ရည်", sub: "la-hpet-yei" },
              { t: "သောက်", sub: "thauk" },
              { t: "ချင်", sub: "chin" },
              { t: "တယ်", sub: "deh" },
            ],
            extras: [
              { t: "စား", sub: "sa" },
              { t: "ရေ", sub: "yei" },
            ],
            my: "လက်ဖက်ရည် သောက်ချင်တယ်",
            roman: "la-hpet-yei thauk-chin-deh",
          },
          {
            kind: "assemble",
            question: "Build the sentence: “I want to eat rice”",
            answer: [
              { t: "ထမင်း", sub: "hta-min" },
              { t: "စား", sub: "sa" },
              { t: "ချင်", sub: "chin" },
              { t: "တယ်", sub: "deh" },
            ],
            extras: [
              { t: "သောက်", sub: "thauk" },
              { t: "ကော်ဖီ", sub: "kaw-fi" },
            ],
            my: "ထမင်း စားချင်တယ်",
            roman: "hta-min sa-chin-deh",
          },
          {
            kind: "listen",
            my: "သောက်ချင်တယ်",
            roman: "thauk-chin-deh",
            en: "I want to drink",
            options: [
              { text: "သောက်ချင်တယ်", sub: "thauk-chin-deh" },
              { text: "စားချင်တယ်", sub: "sa-chin-deh" },
              { text: "ကောင်းတယ်", sub: "kaung-deh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "မုန့်ဟင်းခါး", lSub: "moun-hin-ga", r: "Mohinga" },
              { l: "ကောင်းတယ်", lSub: "kaung-deh", r: "It’s good" },
              { l: "စားချင်တယ်", lSub: "sa-chin-deh", r: "I want to eat" },
              {
                l: "သောက်ချင်တယ်",
                lSub: "thauk-chin-deh",
                r: "I want to drink",
              },
            ],
          },
        ],
      },
      {
        id: "ordering",
        title: "Ordering",
        emoji: "🧾",
        exercises: [
          {
            kind: "learn",
            my: "ပေးပါ",
            roman: "pei-ba",
            en: "Please give (me)…",
            emoji: "🤲",
            note: "Put the thing you want before it: ရေ ပေးပါ = water, please.",
          },
          {
            kind: "assemble",
            question: "Build the sentence: “Water, please”",
            answer: [
              { t: "ရေ", sub: "yei" },
              { t: "ပေး", sub: "pei" },
              { t: "ပါ", sub: "ba" },
            ],
            extras: [
              { t: "စား", sub: "sa" },
              { t: "တယ်", sub: "deh" },
            ],
            my: "ရေ ပေးပါ",
            roman: "yei pei-ba",
          },
          {
            kind: "listen",
            my: "ပေးပါ",
            roman: "pei-ba",
            en: "Please give (me)…",
            options: [
              { text: "ပေးပါ", sub: "pei-ba" },
              { text: "ရပါတယ်", sub: "ya-ba-deh" },
              { text: "တာ့တာ", sub: "ta-ta" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဘယ်လောက်လဲ",
            roman: "beh-lauk-léh",
            en: "How much is it?",
            emoji: "💰",
          },
          {
            kind: "choice",
            question: "You want the bill. What do you ask?",
            options: [
              { text: "ဘယ်လောက်လဲ", sub: "beh-lauk-léh" },
              { text: "နေကောင်းလား", sub: "nei-kaung-la" },
              { text: "ကောင်းတယ်", sub: "kaung-deh" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဘယ်လောက်လဲ",
            roman: "beh-lauk-léh",
            en: "How much is it?",
            options: [
              { text: "ဘယ်လောက်လဲ", sub: "beh-lauk-léh" },
              { text: "ပေးပါ", sub: "pei-ba" },
              { text: "ကောင်းတယ်", sub: "kaung-deh" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build the sentence: “Coffee, please”",
            answer: [
              { t: "ကော်ဖီ", sub: "kaw-fi" },
              { t: "ပေး", sub: "pei" },
              { t: "ပါ", sub: "ba" },
            ],
            extras: [
              { t: "လက်ဖက်ရည်", sub: "la-hpet-yei" },
              { t: "လဲ", sub: "léh" },
            ],
            my: "ကော်ဖီ ပေးပါ",
            roman: "kaw-fi pei-ba",
          },
          {
            kind: "choice",
            question: "The waiter says ရပါတယ် (ya-ba-deh). What do they mean?",
            options: [
              { text: "No problem!" },
              { text: "How much?" },
              { text: "Goodbye" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ရေ ပေးပါ",
            roman: "yei pei-ba",
            en: "Water, please",
            options: [
              { text: "ရေ ပေးပါ", sub: "yei pei-ba" },
              { text: "ကော်ဖီ ပေးပါ", sub: "kaw-fi pei-ba" },
              { text: "ဘယ်လောက်လဲ", sub: "beh-lauk-léh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ပေးပါ", lSub: "pei-ba", r: "Please give" },
              { l: "ဘယ်လောက်လဲ", lSub: "beh-lauk-léh", r: "How much?" },
              {
                l: "ကျေးဇူးတင်ပါတယ်",
                lSub: "kyei-zu tin-ba-deh",
                r: "Thank you",
              },
              { l: "ကောင်းတယ်", lSub: "kaung-deh", r: "It’s good" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "family",
    title: "Family",
    my: "မိသားစု",
    color: "var(--gold)",
    lessons: [
      {
        id: "my-family",
        title: "My family",
        emoji: "👨‍👩‍👧‍👦",
        exercises: [
          {
            kind: "learn",
            my: "အမေ",
            roman: "a-mei",
            en: "Mother",
            emoji: "👩",
            note: "At home kids just say မေမေ (mei-mei), like “mom”.",
          },
          {
            kind: "learn",
            my: "အဖေ",
            roman: "a-hpei",
            en: "Father",
            emoji: "👨",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "အမေ",
            promptRoman: "a-mei",
            options: [
              { text: "Mother" },
              { text: "Father" },
              { text: "Water" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "မိသားစု",
            roman: "mi-tha-zu",
            en: "Family",
            emoji: "👨‍👩‍👧‍👦",
          },
          {
            kind: "listen",
            my: "အဖေ",
            roman: "a-hpei",
            en: "Father",
            options: [
              { text: "အဖေ", sub: "a-hpei" },
              { text: "အမေ", sub: "a-mei" },
              { text: "မိသားစု", sub: "mi-tha-zu" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဒါ",
            roman: "da",
            en: "This",
            emoji: "👉",
            note: "A tiny word you will use constantly. Point and say ဒါ!",
          },
          {
            kind: "learn",
            my: "ဒါ အမေပါ",
            roman: "da a-mei-ba",
            en: "This is (my) mother",
            emoji: "🤱",
            note: "ပါ softens the sentence and makes it polite. You know it from မင်္ဂလာပါ.",
          },
          {
            kind: "choice",
            question: "How do you say “This is (my) father”?",
            options: [
              { text: "ဒါ အဖေပါ", sub: "da a-hpei-ba" },
              { text: "ဒါ အမေပါ", sub: "da a-mei-ba" },
              { text: "နေကောင်းလား", sub: "nei-kaung-la" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "အမေ", lSub: "a-mei", r: "Mother" },
              { l: "အဖေ", lSub: "a-hpei", r: "Father" },
              { l: "မိသားစု", lSub: "mi-tha-zu", r: "Family" },
              { l: "ဒါ", lSub: "da", r: "This" },
            ],
          },
        ],
      },
      {
        id: "siblings",
        title: "Siblings",
        emoji: "🧒",
        exercises: [
          {
            kind: "learn",
            my: "အစ်ကို",
            roman: "a-ko",
            en: "Older brother",
            emoji: "👦",
            note: "Also the friendly way to address any man a bit older than you.",
          },
          {
            kind: "learn",
            my: "အစ်မ",
            roman: "a-ma",
            en: "Older sister",
            emoji: "👧",
            note: "Same trick: a polite way to address a slightly older woman.",
          },
          {
            kind: "listen",
            my: "အစ်ကို",
            roman: "a-ko",
            en: "Older brother",
            options: [
              { text: "အစ်ကို", sub: "a-ko" },
              { text: "အစ်မ", sub: "a-ma" },
              { text: "အမေ", sub: "a-mei" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ညီလေး",
            roman: "nyi-lei",
            en: "Little brother",
            emoji: "👶",
          },
          {
            kind: "learn",
            my: "ညီမလေး",
            roman: "nyi-ma-lei",
            en: "Little sister",
            emoji: "🎀",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "အစ်မ",
            promptRoman: "a-ma",
            options: [
              { text: "Older sister" },
              { text: "Older brother" },
              { text: "Little sister" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “This is (my) older brother”",
            answer: [
              { t: "ဒါ", sub: "da" },
              { t: "အစ်ကို", sub: "a-ko" },
              { t: "ပါ", sub: "ba" },
            ],
            extras: [{ t: "အစ်မ", sub: "a-ma" }],
            my: "ဒါ အစ်ကိုပါ",
            roman: "da a-ko-ba",
          },
          {
            kind: "match",
            pairs: [
              { l: "အစ်ကို", lSub: "a-ko", r: "Older brother" },
              { l: "အစ်မ", lSub: "a-ma", r: "Older sister" },
              { l: "ညီလေး", lSub: "nyi-lei", r: "Little brother" },
              { l: "ညီမလေး", lSub: "nyi-ma-lei", r: "Little sister" },
            ],
          },
        ],
      },
      {
        id: "kids-and-love",
        title: "Kids & love",
        emoji: "👶",
        exercises: [
          {
            kind: "learn",
            my: "ကလေး",
            roman: "kha-lei",
            en: "Child",
            emoji: "👶",
          },
          {
            kind: "learn",
            my: "အဘွား",
            roman: "a-hpwa",
            en: "Grandmother",
            emoji: "👵",
          },
          {
            kind: "learn",
            my: "အဘိုး",
            roman: "a-hpo",
            en: "Grandfather",
            emoji: "👴",
          },
          {
            kind: "listen",
            my: "ကလေး",
            roman: "kha-lei",
            en: "Child",
            options: [
              { text: "ကလေး", sub: "kha-lei" },
              { text: "အဘွား", sub: "a-hpwa" },
              { text: "ညီလေး", sub: "nyi-lei" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ချစ်တယ်",
            roman: "chit-teh",
            en: "(I) love…",
            emoji: "❤️",
            note: "Burmese verbs come last: “Mom love” = I love mom.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ချစ်တယ်",
            promptRoman: "chit-teh",
            options: [
              { text: "(I) love…" },
              { text: "(I) want to eat" },
              { text: "It’s good!" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “This is (my) grandmother”",
            answer: [
              { t: "ဒါ", sub: "da" },
              { t: "အဘွား", sub: "a-hpwa" },
              { t: "ပါ", sub: "ba" },
            ],
            extras: [{ t: "အဘိုး", sub: "a-hpo" }],
            my: "ဒါ အဘွားပါ",
            roman: "da a-hpwa-ba",
          },
          {
            kind: "listen",
            my: "အဘိုး",
            roman: "a-hpo",
            en: "Grandfather",
            options: [
              { text: "အဘိုး", sub: "a-hpo" },
              { text: "အဘွား", sub: "a-hpwa" },
              { text: "အဖေ", sub: "a-hpei" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ကလေး", lSub: "kha-lei", r: "Child" },
              { l: "အဘွား", lSub: "a-hpwa", r: "Grandmother" },
              { l: "အဘိုး", lSub: "a-hpo", r: "Grandfather" },
              { l: "ချစ်တယ်", lSub: "chit-teh", r: "(I) love…" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "places",
    title: "Places & Directions",
    my: "နေရာများ",
    color: "var(--teal)",
    lessons: [
      {
        id: "around-town",
        title: "Around town",
        emoji: "🏘️",
        exercises: [
          {
            kind: "learn",
            my: "အိမ်",
            roman: "ein",
            en: "House / home",
            emoji: "🏠",
          },
          {
            kind: "learn",
            my: "ကျောင်း",
            roman: "kyaung",
            en: "School",
            emoji: "🏫",
            note: "The same word also means “monastery”, since schooling began in monasteries.",
          },
          { kind: "learn", my: "ဈေး", roman: "zei", en: "Market", emoji: "🛒" },
          {
            kind: "listen",
            my: "အိမ်",
            roman: "ein",
            en: "House / home",
            options: [
              { text: "အိမ်", sub: "ein" },
              { text: "ဈေး", sub: "zei" },
              { text: "ကျောင်း", sub: "kyaung" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဘုရား",
            roman: "hpa-ya",
            en: "Pagoda",
            emoji: "🛕",
            note: "Myanmar is dotted with golden pagodas, and Shwedagon is the most famous.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ဈေး",
            promptRoman: "zei",
            options: [
              { text: "Market" },
              { text: "School" },
              { text: "Pagoda" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "လမ်း",
            roman: "lan",
            en: "Street / road",
            emoji: "🛣️",
          },
          {
            kind: "match",
            pairs: [
              { l: "အိမ်", lSub: "ein", r: "House" },
              { l: "ကျောင်း", lSub: "kyaung", r: "School" },
              { l: "ဈေး", lSub: "zei", r: "Market" },
              { l: "လမ်း", lSub: "lan", r: "Street" },
            ],
          },
        ],
      },
      {
        id: "where-is-it",
        title: "Where is it?",
        emoji: "🧭",
        exercises: [
          {
            kind: "learn",
            my: "ဘယ်မှာလဲ",
            roman: "beh-hma-léh",
            en: "Where is…?",
            emoji: "❓",
            note: "ဘယ် (which) + မှာ (at) + လဲ (question). You met လဲ in ဘယ်လောက်လဲ.",
          },
          {
            kind: "learn",
            my: "ဒီမှာ",
            roman: "di-hma",
            en: "Here",
            emoji: "👇",
          },
          {
            kind: "learn",
            my: "ဟိုမှာ",
            roman: "ho-hma",
            en: "Over there",
            emoji: "👉",
          },
          {
            kind: "choice",
            question: "How do you ask “Where is…?”",
            options: [
              { text: "ဘယ်မှာလဲ", sub: "beh-hma-léh" },
              { text: "ဒီမှာ", sub: "di-hma" },
              { text: "ဘယ်လောက်လဲ", sub: "beh-lauk-léh" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “Where is the market?”",
            answer: [
              { t: "ဈေး", sub: "zei" },
              { t: "ဘယ်မှာလဲ", sub: "beh-hma-léh" },
            ],
            extras: [{ t: "ဒီမှာ", sub: "di-hma" }],
            my: "ဈေး ဘယ်မှာလဲ",
            roman: "zei beh-hma-léh",
          },
          {
            kind: "listen",
            my: "ဒီမှာ",
            roman: "di-hma",
            en: "Here",
            options: [
              { text: "ဒီမှာ", sub: "di-hma" },
              { text: "ဟိုမှာ", sub: "ho-hma" },
              { text: "ဘယ်မှာလဲ", sub: "beh-hma-léh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ရှိတယ်",
            roman: "shi-deh",
            en: "There is / it’s (located)",
            emoji: "✅",
          },
          {
            kind: "assemble",
            question: "Build: “The school is over there”",
            answer: [
              { t: "ကျောင်း", sub: "kyaung" },
              { t: "ဟိုမှာ", sub: "ho-hma" },
              { t: "ရှိတယ်", sub: "shi-deh" },
            ],
            extras: [{ t: "ဒီမှာ", sub: "di-hma" }],
            my: "ကျောင်း ဟိုမှာ ရှိတယ်",
            roman: "kyaung ho-hma shi-deh",
          },
          {
            kind: "match",
            pairs: [
              { l: "ဘယ်မှာလဲ", lSub: "beh-hma-léh", r: "Where is…?" },
              { l: "ဒီမှာ", lSub: "di-hma", r: "Here" },
              { l: "ဟိုမှာ", lSub: "ho-hma", r: "Over there" },
              { l: "ရှိတယ်", lSub: "shi-deh", r: "There is" },
            ],
          },
        ],
      },
      {
        id: "left-and-right",
        title: "Left & right",
        emoji: "↔️",
        exercises: [
          {
            kind: "learn",
            my: "ဘယ်ဘက်",
            roman: "beh-bet",
            en: "Left (side)",
            emoji: "⬅️",
            note: "Sneaky: ဘယ် means both “which?” and “left”. Context decides.",
          },
          {
            kind: "learn",
            my: "ညာဘက်",
            roman: "nya-bet",
            en: "Right (side)",
            emoji: "➡️",
          },
          {
            kind: "listen",
            my: "ဘယ်ဘက်",
            roman: "beh-bet",
            en: "Left (side)",
            options: [
              { text: "ဘယ်ဘက်", sub: "beh-bet" },
              { text: "ညာဘက်", sub: "nya-bet" },
              { text: "ဘယ်မှာလဲ", sub: "beh-hma-léh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "သွားပါ",
            roman: "thwa-ba",
            en: "Please go",
            emoji: "🚶",
            note: "Great in a taxi: point and say it.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ညာဘက်",
            promptRoman: "nya-bet",
            options: [
              { text: "Right (side)" },
              { text: "Left (side)" },
              { text: "Straight ahead" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “Please go right”",
            answer: [
              { t: "ညာဘက်", sub: "nya-bet" },
              { t: "သွားပါ", sub: "thwa-ba" },
            ],
            extras: [{ t: "ဘယ်ဘက်", sub: "beh-bet" }],
            my: "ညာဘက် သွားပါ",
            roman: "nya-bet thwa-ba",
          },
          {
            kind: "learn",
            my: "ရပ်ပါ",
            roman: "yat-pa",
            en: "Please stop",
            emoji: "🛑",
          },
          {
            kind: "listen",
            my: "သွားပါ",
            roman: "thwa-ba",
            en: "Please go",
            options: [
              { text: "သွားပါ", sub: "thwa-ba" },
              { text: "ရပ်ပါ", sub: "yat-pa" },
              { text: "ပေးပါ", sub: "pei-ba" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ဘယ်ဘက်", lSub: "beh-bet", r: "Left" },
              { l: "ညာဘက်", lSub: "nya-bet", r: "Right" },
              { l: "သွားပါ", lSub: "thwa-ba", r: "Please go" },
              { l: "ရပ်ပါ", lSub: "yat-pa", r: "Please stop" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "time",
    title: "Time & Days",
    my: "အချိန်",
    color: "var(--plum)",
    lessons: [
      {
        id: "today-tomorrow",
        title: "Today & tomorrow",
        emoji: "📅",
        exercises: [
          {
            kind: "learn",
            my: "ဒီနေ့",
            roman: "di-nei",
            en: "Today",
            emoji: "📅",
            note: "ဒီ (this) + နေ့ (day). You know ဒီ from ဒီမှာ (here).",
          },
          {
            kind: "learn",
            my: "မနက်ဖြန်",
            roman: "ma-net-hpyan",
            en: "Tomorrow",
            emoji: "🌄",
          },
          {
            kind: "learn",
            my: "မနေ့က",
            roman: "ma-nei-ga",
            en: "Yesterday",
            emoji: "🌒",
          },
          {
            kind: "listen",
            my: "ဒီနေ့",
            roman: "di-nei",
            en: "Today",
            options: [
              { text: "ဒီနေ့", sub: "di-nei" },
              { text: "မနက်ဖြန်", sub: "ma-net-hpyan" },
              { text: "မနေ့က", sub: "ma-nei-ga" },
            ],
            correct: 0,
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "မနက်ဖြန်",
            promptRoman: "ma-net-hpyan",
            options: [
              { text: "Tomorrow" },
              { text: "Yesterday" },
              { text: "Today" },
            ],
            correct: 0,
          },
          { kind: "learn", my: "အခု", roman: "a-khu", en: "Now", emoji: "⏰" },
          {
            kind: "learn",
            my: "သွားမယ်",
            roman: "thwa-meh",
            en: "(I) will go",
            emoji: "🎒",
            note: "မယ် marks the future. Compare သွားပါ (please go).",
          },
          {
            kind: "assemble",
            question: "Build: “I’ll go tomorrow”",
            answer: [
              { t: "မနက်ဖြန်", sub: "ma-net-hpyan" },
              { t: "သွားမယ်", sub: "thwa-meh" },
            ],
            extras: [{ t: "ဒီနေ့", sub: "di-nei" }],
            my: "မနက်ဖြန် သွားမယ်",
            roman: "ma-net-hpyan thwa-meh",
          },
          {
            kind: "match",
            pairs: [
              { l: "ဒီနေ့", lSub: "di-nei", r: "Today" },
              { l: "မနက်ဖြန်", lSub: "ma-net-hpyan", r: "Tomorrow" },
              { l: "မနေ့က", lSub: "ma-nei-ga", r: "Yesterday" },
              { l: "အခု", lSub: "a-khu", r: "Now" },
            ],
          },
        ],
      },
      {
        id: "morning-to-night",
        title: "Morning to night",
        emoji: "🌅",
        exercises: [
          {
            kind: "learn",
            my: "မနက်",
            roman: "ma-net",
            en: "Morning",
            emoji: "🌅",
          },
          {
            kind: "learn",
            my: "နေ့လယ်",
            roman: "nei-leh",
            en: "Noon / midday",
            emoji: "☀️",
          },
          {
            kind: "learn",
            my: "ညနေ",
            roman: "nya-nei",
            en: "Evening",
            emoji: "🌇",
          },
          {
            kind: "listen",
            my: "မနက်",
            roman: "ma-net",
            en: "Morning",
            options: [
              { text: "မနက်", sub: "ma-net" },
              { text: "ညနေ", sub: "nya-nei" },
              { text: "နေ့လယ်", sub: "nei-leh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ည",
            roman: "nya",
            en: "Night",
            emoji: "🌙",
            note: "One letter, one word. You met ည in the script unit!",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ညနေ",
            promptRoman: "nya-nei",
            options: [
              { text: "Evening" },
              { text: "Morning" },
              { text: "Night" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “I’ll go tomorrow morning”",
            answer: [
              { t: "မနက်ဖြန်", sub: "ma-net-hpyan" },
              { t: "မနက်", sub: "ma-net" },
              { t: "သွားမယ်", sub: "thwa-meh" },
            ],
            extras: [{ t: "ည", sub: "nya" }],
            my: "မနက်ဖြန် မနက် သွားမယ်",
            roman: "ma-net-hpyan ma-net thwa-meh",
          },
          {
            kind: "listen",
            my: "ည",
            roman: "nya",
            en: "Night",
            options: [
              { text: "ည", sub: "nya" },
              { text: "ညနေ", sub: "nya-nei" },
              { text: "နေ့လယ်", sub: "nei-leh" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "မနက်", lSub: "ma-net", r: "Morning" },
              { l: "နေ့လယ်", lSub: "nei-leh", r: "Noon" },
              { l: "ညနေ", lSub: "nya-nei", r: "Evening" },
              { l: "ည", lSub: "nya", r: "Night" },
            ],
          },
        ],
      },
      {
        id: "days-of-week",
        title: "Days of the week",
        emoji: "🗓️",
        exercises: [
          {
            kind: "learn",
            my: "တနင်္လာနေ့",
            roman: "ta-nin-la-nei",
            en: "Monday",
            emoji: "💼",
            note: "Every day name ends in နေ့ (day). Day names come from planets, like in English!",
          },
          {
            kind: "learn",
            my: "သောကြာနေ့",
            roman: "thauk-kya-nei",
            en: "Friday",
            emoji: "🎉",
          },
          {
            kind: "listen",
            my: "တနင်္လာနေ့",
            roman: "ta-nin-la-nei",
            en: "Monday",
            options: [
              { text: "တနင်္လာနေ့", sub: "ta-nin-la-nei" },
              { text: "သောကြာနေ့", sub: "thauk-kya-nei" },
              { text: "ဒီနေ့", sub: "di-nei" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "စနေနေ့",
            roman: "sa-nei-nei",
            en: "Saturday",
            emoji: "🧺",
          },
          {
            kind: "learn",
            my: "တနင်္ဂနွေနေ့",
            roman: "ta-nin-ga-nwei-nei",
            en: "Sunday",
            emoji: "🏖️",
            note: "စနေ၊ တနင်္ဂနွေ: the weekend!",
          },
          {
            kind: "choice",
            question: "Which day is “Friday”?",
            options: [
              { text: "သောကြာနေ့", sub: "thauk-kya-nei" },
              { text: "စနေနေ့", sub: "sa-nei-nei" },
              { text: "တနင်္လာနေ့", sub: "ta-nin-la-nei" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "တွေ့မယ်",
            roman: "twei-meh",
            en: "(We’ll) meet",
            emoji: "🤝",
            note: "မနက်ဖြန် တွေ့မယ်, meaning “see you tomorrow”, is how friends part.",
          },
          {
            kind: "assemble",
            question: "Build: “See you tomorrow”",
            answer: [
              { t: "မနက်ဖြန်", sub: "ma-net-hpyan" },
              { t: "တွေ့မယ်", sub: "twei-meh" },
            ],
            extras: [{ t: "မနေ့က", sub: "ma-nei-ga" }],
            my: "မနက်ဖြန် တွေ့မယ်",
            roman: "ma-net-hpyan twei-meh",
          },
          {
            kind: "match",
            pairs: [
              { l: "တနင်္လာနေ့", lSub: "ta-nin-la-nei", r: "Monday" },
              { l: "သောကြာနေ့", lSub: "thauk-kya-nei", r: "Friday" },
              { l: "စနေနေ့", lSub: "sa-nei-nei", r: "Saturday" },
              { l: "တနင်္ဂနွေနေ့", lSub: "ta-nin-ga-nwei-nei", r: "Sunday" },
            ],
          },
        ],
      },
    ],
  },
];

export const allLessons = course.flatMap((u) =>
  u.lessons.map((l) => ({ unit: u, lesson: l })),
);

export function findLesson(id: string) {
  return allLessons.find((x) => x.lesson.id === id);
}
