// Shwe beginner course data.
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
 * never forces anyone through the extra material. Steps 2 and up add more
 * words on the same topic for learners who want them, and are entered from
 * the path node after step 1 is done.
 *
 * A flat tag rather than nested `steps[]` arrays on purpose: everything
 * downstream reads `lesson.exercises` flat (the linter, the audio generator,
 * the vocab index, the e2e tests), and a tag leaves every one of them working
 * untouched. Only the lesson player filters.
 *
 * Nothing but this type and `ROUND_LABELS` bounds the count — every consumer
 * derives its steps from `lessonSteps()` — so a lesson with genuinely more to
 * teach can run to four parts without the shorter ones growing an empty one.
 */
export type LessonStep = 1 | 2 | 3 | 4;

export type ExerciseBody =
  | {
      kind: "learn";
      my: string;
      /** Omit only in a `scriptOnly` lesson — see Lesson.scriptOnly. */
      roman?: string;
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
      /** Omit only in a `scriptOnly` lesson — see Lesson.scriptOnly. */
      roman?: string;
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
      /**
       * Keep the script options even for a learner who reads Burmese, who
       * would otherwise be shown the meanings instead (see $lib/listen-mode).
       *
       * For the two cases where swapping in English would make the drill
       * worse, not better: script-reading drills where decoding *is* the
       * skill being tested, and words with no stable English gloss — the
       * discourse particles နော် / ပေါ့ / လေ have labels, not translations,
       * so choosing between those labels tests nothing.
       */
      keepScript?: true;
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
      /** Omit only in a `scriptOnly` lesson — see Lesson.scriptOnly. */
      roman?: string;
    };

/** An exercise, plus which step of its lesson it belongs to (default 1). */
export type Exercise = ExerciseBody & { step?: LessonStep };

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  exercises: Exercise[];
  /**
   * No romanization anywhere in this lesson — script, audio and meaning
   * only, on purpose. Grading never reads `roman` (listen checks an option
   * index, assemble checks the Burmese text), so omitting it changes
   * nothing about correctness, only the display. Reserved for learners
   * further into the course: `lint:content` enforces the two lessons that
   * make this legible — `roman` must be *present* everywhere else, and
   * *absent* everywhere a lesson claims to be scriptOnly, so the flag can't
   * quietly drift from what's actually authored.
   */
  scriptOnly?: true;
  /**
   * In the path, but not on the ladder: this lesson never blocks the one
   * after it, and it is left out of the course total.
   *
   * For material that is genuinely worth having and genuinely not for
   * everyone — the loanwords lesson is the case that prompted it, since a
   * learner who already reads the script gets much less from "this word was
   * English all along" than a beginner does. Making them clear it to reach
   * the rest of the unit would be charging everyone for a lesson aimed at
   * some.
   *
   * Deliberately *not* the same thing as `isSkipped` in `progress`: skipping
   * is a learner's choice about a unit they already know, recorded per
   * profile. This is a property of the content, so it reads the same for
   * everybody and needs no state.
   */
  optional?: true;
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
            note: "The pair wraps around a verb: မ opens the negation, ဘူး closes it.",
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
            note: "လဲ is the question particle for open questions — the ones you can’t answer yes or no.",
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
            note: "Literally “are you well?” — လား is what turns a statement into a yes/no question.",
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

          // ── Step 2: answering honestly ────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "မကောင်းဘူး",
            roman: "ma-kaung-bu",
            en: "Not well",
            emoji: "😕",
            note: "နေကောင်းပါတယ် negated: မ + ကောင်း + ဘူး. The same wrapper as မဟုတ်ဘူး.",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "မကောင်းဘူး",
            promptRoman: "ma-kaung-bu",
            options: [{ text: "Not well" }, { text: "I’m fine" }, { text: "Bye!" }],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "ပင်ပန်းတယ်",
            roman: "pin-pan-deh",
            en: "I’m tired",
            emoji: "😴",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဗိုက်ဆာတယ်",
            roman: "baik-sa-deh",
            en: "I’m hungry",
            emoji: "🍜",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဗိုက်ဆာတယ်",
            roman: "baik-sa-deh",
            en: "I’m hungry",
            optionLang: "en",
            options: [{ text: "I’m hungry" }, { text: "I’m tired" }, { text: "Not well" }],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "ရေဆာတယ်",
            roman: "yei-sa-deh",
            en: "I’m thirsty",
            emoji: "💧",
            note: "Same shape as ဗိုက်ဆာတယ်: swap the belly for water and you’re thirsty.",
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "မကောင်းဘူး", lSub: "ma-kaung-bu", r: "Not well" },
              { l: "ပင်ပန်းတယ်", lSub: "pin-pan-deh", r: "I’m tired" },
              { l: "ဗိုက်ဆာတယ်", lSub: "baik-sa-deh", r: "I’m hungry" },
              { l: "ရေဆာတယ်", lSub: "yei-sa-deh", r: "I’m thirsty" },
            ],
          },

          // ── Step 3: parting words ─────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "မနက်ဖြန်တွေ့မယ်",
            roman: "ma-net-hpyan twei-meh",
            en: "See you tomorrow",
            emoji: "🌅",
            note: "မယ် marks something still to come — the future ending. You’ll meet တွေ့မယ် on its own in the Time unit.",
          },
          {
            kind: "learn",
            step: 3,
            my: "သွားတော့မယ်",
            roman: "thwa-daw-meh",
            en: "I’m off now",
            emoji: "🚪",
            note: "What you actually say when leaving, more than တာ့တာ.",
          },
          {
            kind: "listen",
            step: 3,
            my: "သွားတော့မယ်",
            roman: "thwa-daw-meh",
            en: "I’m off now",
            optionLang: "en",
            // Distractors from a different corner of the lesson on purpose.
            // Pitting this against "See you" and "See you tomorrow" asked
            // which English parting the author had picked for it, which is a
            // guess even for someone who understood the Burmese perfectly.
            options: [{ text: "I’m off now" }, { text: "I’m tired" }, { text: "Not well" }],
            correct: 0,
          },
          {
            kind: "learn",
            step: 3,
            my: "ဂရုစိုက်ပါ",
            roman: "ga-yu-saik-pa",
            en: "Take care",
            emoji: "💛",
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “See you tomorrow”",
            answer: [{ t: "မနက်ဖြန်" }, { t: "တွေ့" }, { t: "မယ်" }],
            extras: [{ t: "ဘူး" }, { t: "တာ့တာ" }, { t: "ပါ" }],
            my: "မနက်ဖြန်တွေ့မယ်",
            roman: "ma-net-hpyan twei-meh",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "တွေ့မယ်", lSub: "twei-meh", r: "See you" },
              { l: "မနက်ဖြန်တွေ့မယ်", lSub: "ma-net-hpyan twei-meh", r: "See you tomorrow" },
              { l: "သွားတော့မယ်", lSub: "thwa-daw-meh", r: "I’m off now" },
              { l: "ဂရုစိုက်ပါ", lSub: "ga-yu-saik-pa", r: "Take care" },
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

          // ── Step 2: you, and asking after someone ─────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ခင်ဗျား",
            roman: "khin-bya",
            en: "you (said by a man)",
            emoji: "👉",
            note: "Written like the politeness particle ခင်ဗျာ but with a tone mark. A woman uses ရှင် for “you” — the same word she ends polite sentences with.",
          },
          {
            kind: "learn",
            step: 2,
            my: "နာမည်ဘယ်လိုခေါ်လဲ",
            roman: "nan-meh bèh-lo khaw-lèh",
            en: "What’s your name?",
            emoji: "🙋",
            note: "Literally “name how is-called?”. Burmese leaves out “your” when it’s obvious.",
          },
          {
            kind: "choice",
            step: 2,
            question: "Someone wants to know your name. What do they say?",
            options: [
              { text: "နာမည်ဘယ်လိုခေါ်လဲ", sub: "nan-meh bèh-lo khaw-lèh" },
              { text: "နေကောင်းလား", sub: "nei-kaung-la" },
              { text: "ရပါတယ်", sub: "ya-ba-deh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "တွေ့ရတာဝမ်းသာပါတယ်",
            roman: "twei-ya-da wun-tha-ba-deh",
            en: "Nice to meet you",
            emoji: "🤝",
          },
          {
            kind: "listen",
            step: 2,
            my: "နာမည်ဘယ်လိုခေါ်လဲ",
            roman: "nan-meh bèh-lo khaw-lèh",
            en: "What’s your name?",
            optionLang: "en",
            options: [
              { text: "What’s your name?" },
              { text: "Nice to meet you" },
              { text: "It’s okay / no problem" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ခင်ဗျား", lSub: "khin-bya", r: "you (man speaking)" },
              { l: "နာမည်ဘယ်လိုခေါ်လဲ", lSub: "nan-meh bèh-lo khaw-lèh", r: "What’s your name?" },
              { l: "တွေ့ရတာဝမ်းသာပါတယ်", lSub: "twei-ya-da wun-tha-ba-deh", r: "Nice to meet you" },
              { l: "နာမည်", lSub: "nan-meh", r: "Name" },
            ],
          },

          // ── Step 3: excuse me, and please ─────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ခွင့်ပြုပါ",
            roman: "khwin-pyu-ba",
            en: "Excuse me",
            emoji: "🙇",
            note: "For getting past someone or interrupting — not the same as apologising (တောင်းပန်ပါတယ်).",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကျေးဇူးပြုပြီး",
            roman: "kyei-zu pyu-bi",
            en: "Please",
            emoji: "🙏",
            note: "Goes in front of a request. Shares ကျေးဇူး with “thank you”.",
          },
          {
            kind: "choice",
            step: 3,
            question: "You need to squeeze past someone. What do you say?",
            options: [
              { text: "ခွင့်ပြုပါ", sub: "khwin-pyu-ba" },
              { text: "ကျေးဇူးပြုပြီး", sub: "kyei-zu pyu-bi" },
              { text: "တွေ့မယ်", sub: "twei-meh" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 3,
            my: "နားမလည်ဘူး",
            roman: "na-ma-leh-bu",
            en: "I don’t understand",
            emoji: "😅",
            note: "The most useful sentence in any language. မ…ဘူး again, around နားလည် “understand”.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဖြေးဖြေးပြောပါ",
            roman: "hpyei-hpyei pyaw-ba",
            en: "Please speak slowly",
            emoji: "🐢",
          },
          {
            kind: "listen",
            step: 3,
            my: "နားမလည်ဘူး",
            roman: "na-ma-leh-bu",
            en: "I don’t understand",
            optionLang: "en",
            options: [
              { text: "I don’t understand" },
              { text: "Please speak slowly" },
              { text: "Excuse me" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ခွင့်ပြုပါ", lSub: "khwin-pyu-ba", r: "Excuse me" },
              { l: "ကျေးဇူးပြုပြီး", lSub: "kyei-zu pyu-bi", r: "Please" },
              { l: "နားမလည်ဘူး", lSub: "na-ma-leh-bu", r: "I don’t understand" },
              { l: "ဖြေးဖြေးပြောပါ", lSub: "hpyei-hpyei pyaw-ba", r: "Please speak slowly" },
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

          // ── Step 2: counting things ───────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "တစ်ခု",
            roman: "ta-khu",
            en: "one (thing)",
            emoji: "1️⃣",
            note: "Burmese never counts bare. ခု is the all-purpose counter for objects, and the number changes shape in front of it: တစ် → တစ်ခု.",
          },
          {
            kind: "learn",
            step: 2,
            my: "နှစ်ခု",
            roman: "hna-khu",
            en: "two (things)",
            emoji: "2️⃣",
          },
          {
            kind: "learn",
            step: 2,
            my: "တစ်ယောက်",
            roman: "ta-yauk",
            en: "one (person)",
            emoji: "🧍",
            note: "People get their own counter, ယောက်. Using ခု for a person is a real mistake, not a small one.",
          },
          {
            kind: "choice",
            step: 2,
            question: "You are counting two people. Which counter?",
            options: [
              { text: "ယောက်", sub: "yauk" },
              { text: "ခု", sub: "khu" },
              { text: "ဆယ်", sub: "hseh" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "တစ်ခု",
            roman: "ta-khu",
            en: "one (thing)",
            optionLang: "en",
            options: [{ text: "one (thing)" }, { text: "two (things)" }, { text: "one (person)" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "တစ်ခု", lSub: "ta-khu", r: "one (thing)" },
              { l: "နှစ်ခု", lSub: "hna-khu", r: "two (things)" },
              { l: "တစ်ယောက်", lSub: "ta-yauk", r: "one (person)" },
              { l: "ငါး", lSub: "nga", r: "Five (5)" },
            ],
          },

          // ── Step 3: how many? ─────────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်နှစ်ခုလဲ",
            roman: "bèh-hna-khu-lèh",
            en: "How many?",
            emoji: "🔢",
            note: "ဘယ်နှစ် “how many” + the counter. Swap ခု for ယောက် when you are asking about people.",
          },
          {
            kind: "learn",
            step: 3,
            my: "အများကြီး",
            roman: "a-mya-kyi",
            en: "a lot",
            emoji: "🫱",
          },
          {
            kind: "learn",
            step: 3,
            my: "နည်းနည်း",
            roman: "neh-neh",
            en: "a little",
            emoji: "🤏",
          },
          {
            kind: "listen",
            step: 3,
            my: "နည်းနည်း",
            roman: "neh-neh",
            en: "a little",
            optionLang: "en",
            options: [{ text: "a little" }, { text: "a lot" }, { text: "How many?" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဘယ်နှစ်ခုလဲ", lSub: "bèh-hna-khu-lèh", r: "How many?" },
              { l: "အများကြီး", lSub: "a-mya-kyi", r: "a lot" },
              { l: "နည်းနည်း", lSub: "neh-neh", r: "a little" },
              { l: "တစ်ခု", lSub: "ta-khu", r: "one (thing)" },
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

          // ── Step 2: past ten ──────────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဆယ့်တစ်",
            roman: "hseh-ta",
            en: "Eleven (11)",
            emoji: "🔢",
            note: "ဆယ် “ten” takes a tone mark before the next digit: ဆယ့် + တစ်.",
          },
          {
            kind: "learn",
            step: 2,
            my: "နှစ်ဆယ်",
            roman: "hna-hseh",
            en: "Twenty (20)",
            emoji: "🔢",
            note: "Two tens. The pattern runs all the way up: သုံးဆယ် is thirty.",
          },
          {
            kind: "learn",
            step: 2,
            my: "တစ်ရာ",
            roman: "ta-ya",
            en: "One hundred (100)",
            emoji: "💯",
          },
          {
            kind: "choice",
            step: 2,
            question: "How do you say twenty?",
            options: [
              { text: "နှစ်ဆယ်", sub: "hna-hseh" },
              { text: "ဆယ့်တစ်", sub: "hseh-ta" },
              { text: "တစ်ရာ", sub: "ta-ya" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "တစ်ရာ",
            roman: "ta-ya",
            en: "One hundred (100)",
            optionLang: "en",
            options: [
              { text: "One hundred (100)" },
              { text: "Twenty (20)" },
              { text: "Eleven (11)" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဆယ့်တစ်", lSub: "hseh-ta", r: "11" },
              { l: "နှစ်ဆယ်", lSub: "hna-hseh", r: "20" },
              { l: "တစ်ရာ", lSub: "ta-ya", r: "100" },
              { l: "ဆယ်", lSub: "hseh", r: "10" },
            ],
          },

          // ── Step 3: money ─────────────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ကျပ်",
            roman: "kyat",
            en: "kyat (the currency)",
            emoji: "💵",
            note: "Prices are said as a number then ကျပ်: တစ်ရာကျပ် is 100 kyat.",
          },
          {
            kind: "learn",
            step: 3,
            my: "တစ်ထောင်",
            roman: "ta-htaung",
            en: "One thousand (1,000)",
            emoji: "🔢",
          },
          {
            kind: "learn",
            step: 3,
            my: "ငါးထောင်",
            roman: "nga-htaung",
            en: "Five thousand (5,000)",
            emoji: "💴",
            note: "A common note. Everyday prices in Myanmar run in thousands, so this is the range you will actually hear.",
          },
          {
            kind: "listen",
            step: 3,
            my: "တစ်ထောင်",
            roman: "ta-htaung",
            en: "One thousand (1,000)",
            optionLang: "en",
            options: [
              { text: "One thousand (1,000)" },
              { text: "Five thousand (5,000)" },
              { text: "One hundred (100)" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ကျပ်", lSub: "kyat", r: "kyat" },
              { l: "တစ်ထောင်", lSub: "ta-htaung", r: "1,000" },
              { l: "ငါးထောင်", lSub: "nga-htaung", r: "5,000" },
              { l: "တစ်ရာ", lSub: "ta-ya", r: "100" },
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

          // ── Step 2: digits in the wild ────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "၄ ၅ ၆",
            roman: "lei, nga, chauk",
            en: "4 5 6",
            emoji: "✍️",
            note: "၄ and ၉ are the pair people mix up most — ၄ is open at the top, ၉ is closed.",
          },
          {
            kind: "learn",
            step: 2,
            my: "၇ ၈ ၉",
            roman: "khu-hnit, shit, kou",
            en: "7 8 9",
            emoji: "✍️",
          },
          {
            kind: "learn",
            step: 2,
            my: "၁၀",
            roman: "ta-hseh",
            en: "10",
            emoji: "🔟",
            note: "၀ is zero — a plain circle, and the same shape as the letter ဝ.",
          },
          {
            kind: "choice",
            step: 2,
            question: "Which digit is “6”?",
            options: [{ text: "၆" }, { text: "၄" }, { text: "၉" }],
            correct: 0,
          },
          {
            kind: "choice",
            step: 2,
            question: "Which digit is “9”?",
            options: [{ text: "၉" }, { text: "၆" }, { text: "၅" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "၄", r: "4" },
              { l: "၆", r: "6" },
              { l: "၉", r: "9" },
              { l: "၀", r: "0" },
            ],
          },

          // ── Step 3: reading a price ───────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "၁၀၀",
            roman: "ta-ya",
            en: "100",
            emoji: "💯",
            note: "Bus fares, price tags and door numbers are all written this way.",
          },
          {
            kind: "learn",
            step: 3,
            my: "၁၀၀၀",
            roman: "ta-htaung",
            en: "1000",
            emoji: "💵",
          },
          {
            kind: "choice",
            step: 3,
            question: "A price tag reads ၁၀၀၀. How much is that?",
            options: [{ text: "1000" }, { text: "100" }, { text: "10" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "၁၀", r: "10" },
              { l: "၁၀၀", r: "100" },
              { l: "၁၀၀၀", r: "1000" },
              { l: "၅", r: "5" },
            ],
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
            keepScript: true,
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
            keepScript: true,
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
            keepScript: true,
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

          // ── Step 2: the last of the row ───────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဃ",
            roman: "gha",
            en: "The letter “gha”",
            note: "The fifth of the ka row, and the rarest. Worth recognising, not worth worrying about.",
          },
          {
            kind: "choice",
            step: 2,
            question: "Which one is “gha”?",
            options: [{ text: "ဃ" }, { text: "ဂ" }, { text: "ခ" }],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "ကား",
            roman: "ka",
            en: "Car",
            emoji: "🚗",
            note: "Your first real word from this row: က plus the vowel ာ and a tone mark.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ငါ",
            roman: "nga",
            en: "I / me (casual)",
            emoji: "🙋",
            note: "The blunt “I” — friends and family only. ကျွန်တော်/ကျွန်မ is what you use elsewhere.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ကား",
            roman: "ka",
            en: "Car",
            optionLang: "en",
            options: [{ text: "Car" }, { text: "I / me (casual)" }, { text: "The letter “gha”" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ကား", lSub: "ka", r: "Car" },
              { l: "ငါ", lSub: "nga", r: "I / me (casual)" },
              { l: "က", lSub: "ka", r: "letter ka" },
              { l: "ဃ", lSub: "gha", r: "letter gha" },
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
            keepScript: true,
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
            keepScript: true,
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

          // ── Step 2: words from the sa row ─────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "စာ",
            roman: "sa",
            en: "Writing / a letter",
            emoji: "📝",
            note: "စ plus the vowel ာ. The same word covers a written letter, a book’s text and study.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆေး",
            roman: "hsay",
            en: "Medicine",
            emoji: "💊",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆီ",
            roman: "hsi",
            en: "Oil",
            emoji: "🫒",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "စာ",
            promptRoman: "sa",
            options: [{ text: "Writing / a letter" }, { text: "Medicine" }, { text: "Oil" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ဆေး",
            roman: "hsay",
            en: "Medicine",
            optionLang: "en",
            options: [{ text: "Medicine" }, { text: "Oil" }, { text: "Writing / a letter" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "စာ", lSub: "sa", r: "Writing" },
              { l: "ဆေး", lSub: "hsay", r: "Medicine" },
              { l: "ဆီ", lSub: "hsi", r: "Oil" },
              { l: "စ", lSub: "sa", r: "letter sa" },
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
            keepScript: true,
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
            keepScript: true,
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
            keepScript: true,
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
            keepScript: true,
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

          // ── Step 2: two more shapes, four more words ──────────────────
          {
            kind: "learn",
            step: 2,
            my: "ထ",
            roman: "hta",
            en: "The letter “hta”",
            note: "တ with an extra loop. The pair တ/ထ is unaspirated vs aspirated — the same split as က/ခ.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဖ",
            roman: "hpa",
            en: "The letter “hpa”",
            note: "The aspirated partner of ပ.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ပန်း",
            roman: "pan",
            en: "Flower",
            emoji: "🌸",
          },
          {
            kind: "learn",
            step: 2,
            my: "မီး",
            roman: "mi",
            en: "Fire / light",
            emoji: "🔥",
          },
          {
            kind: "choice",
            step: 2,
            question: "Which one is “hta”?",
            options: [{ text: "ထ" }, { text: "တ" }, { text: "ဖ" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ပန်း",
            roman: "pan",
            en: "Flower",
            optionLang: "en",
            options: [{ text: "Flower" }, { text: "Fire / light" }, { text: "Car" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ပန်း", lSub: "pan", r: "Flower" },
              { l: "မီး", lSub: "mi", r: "Fire / light" },
              { l: "ထ", lSub: "hta", r: "letter hta" },
              { l: "ဖ", lSub: "hpa", r: "letter hpa" },
            ],
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

          // ── Step 2: the rest of the tea shop ──────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ရေနွေးကြမ်း",
            roman: "yei-nwei-kyan",
            en: "Plain green tea",
            emoji: "🍵",
            note: "Free on every tea shop table, in a shared flask. Nobody orders it; you just pour.",
          },
          {
            kind: "learn",
            step: 2,
            my: "နို့",
            roman: "no",
            en: "Milk",
            emoji: "🥛",
          },
          {
            kind: "learn",
            step: 2,
            my: "သကြား",
            roman: "tha-kya",
            en: "Sugar",
            emoji: "🍚",
          },
          {
            kind: "learn",
            step: 2,
            my: "မုန့်",
            roman: "moun",
            en: "Snack / pastry",
            emoji: "🥟",
            note: "The plate of little things that arrives unasked. You pay for what you eat.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ရေနွေးကြမ်း",
            roman: "yei-nwei-kyan",
            en: "Plain green tea",
            optionLang: "en",
            options: [{ text: "Plain green tea" }, { text: "Milk" }, { text: "Sugar" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ရေနွေးကြမ်း", lSub: "yei-nwei-kyan", r: "Plain green tea" },
              { l: "နို့", lSub: "no", r: "Milk" },
              { l: "သကြား", lSub: "tha-kya", r: "Sugar" },
              { l: "မုန့်", lSub: "moun", r: "Snack" },
            ],
          },

          // ── Step 3: how you want it ───────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ပူပူ",
            roman: "pu-pu",
            en: "Hot",
            emoji: "♨️",
            note: "Doubling an adjective is how Burmese says “make it that way”.",
          },
          {
            kind: "learn",
            step: 3,
            my: "အေးအေး",
            roman: "ei-ei",
            en: "Cold",
            emoji: "🧊",
          },
          {
            kind: "learn",
            step: 3,
            my: "တစ်ခွက်",
            roman: "ta-khwet",
            en: "One cup",
            emoji: "☕",
            note: "ခွက် is the counter for cups and glasses — the counter pattern from the Numbers unit.",
          },
          {
            kind: "listen",
            step: 3,
            my: "တစ်ခွက်",
            roman: "ta-khwet",
            en: "One cup",
            optionLang: "en",
            options: [{ text: "One cup" }, { text: "Hot" }, { text: "Cold" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ပူပူ", lSub: "pu-pu", r: "Hot" },
              { l: "အေးအေး", lSub: "ei-ei", r: "Cold" },
              { l: "တစ်ခွက်", lSub: "ta-khwet", r: "One cup" },
              { l: "ကော်ဖီ", lSub: "kaw-hpi", r: "Coffee" },
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

          // ── Step 2: what it tastes like ───────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "စပ်တယ်",
            roman: "sat-teh",
            en: "It’s spicy",
            emoji: "🌶️",
            note: "The most load-bearing word on this page.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ချိုတယ်",
            roman: "cho-deh",
            en: "It’s sweet",
            emoji: "🍬",
          },
          {
            kind: "learn",
            step: 2,
            my: "ငန်တယ်",
            roman: "ngan-deh",
            en: "It’s salty",
            emoji: "🧂",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "စပ်တယ်",
            promptRoman: "sat-teh",
            options: [{ text: "It’s spicy" }, { text: "It’s sweet" }, { text: "It’s salty" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ချိုတယ်",
            roman: "cho-deh",
            en: "It’s sweet",
            optionLang: "en",
            options: [{ text: "It’s sweet" }, { text: "It’s spicy" }, { text: "It’s salty" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "စပ်တယ်", lSub: "sat-teh", r: "spicy" },
              { l: "ချိုတယ်", lSub: "cho-deh", r: "sweet" },
              { l: "ငန်တယ်", lSub: "ngan-deh", r: "salty" },
              { l: "ကောင်းတယ်", lSub: "kaung-deh", r: "good" },
            ],
          },

          // ── Step 3: like and dislike ──────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ကြိုက်တယ်",
            roman: "kyaik-teh",
            en: "(I) like it",
            emoji: "😊",
          },
          {
            kind: "learn",
            step: 3,
            my: "မကြိုက်ဘူး",
            roman: "ma-kyaik-bu",
            en: "(I) don’t like it",
            emoji: "😐",
            note: "မ…ဘူး again. Once you spot the wrapper you can negate anything.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဆာတယ်",
            roman: "sa-deh",
            en: "(I’m) hungry",
            emoji: "🍜",
          },
          {
            kind: "listen",
            step: 3,
            my: "မကြိုက်ဘူး",
            roman: "ma-kyaik-bu",
            en: "(I) don’t like it",
            optionLang: "en",
            options: [
              { text: "(I) don’t like it" },
              { text: "(I) like it" },
              { text: "(I’m) hungry" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “(I) don’t like it”",
            answer: [{ t: "မ" }, { t: "ကြိုက်" }, { t: "ဘူး" }],
            extras: [{ t: "တယ်" }, { t: "လား" }, { t: "ပါ" }],
            my: "မကြိုက်ဘူး",
            roman: "ma-kyaik-bu",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ကြိုက်တယ်", lSub: "kyaik-teh", r: "like it" },
              { l: "မကြိုက်ဘူး", lSub: "ma-kyaik-bu", r: "don’t like it" },
              { l: "ဆာတယ်", lSub: "sa-deh", r: "hungry" },
              { l: "စပ်တယ်", lSub: "sat-teh", r: "spicy" },
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

          // ── Step 2: asking for things ─────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ရှိလား",
            roman: "shi-la",
            en: "Do you have…?",
            emoji: "🤔",
            note: "ရှိ “exist” + the yes/no particle လား. Point at a thing and say it.",
          },
          {
            kind: "learn",
            step: 2,
            my: "မလိုဘူး",
            roman: "ma-lo-bu",
            en: "(I) don’t need it",
            emoji: "🙅",
          },
          {
            kind: "learn",
            step: 2,
            my: "ထပ်",
            roman: "htat",
            en: "more / again",
            emoji: "➕",
            note: "Goes in front of the verb: ထပ်ပေးပါ “give me more”.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ရှိလား",
            roman: "shi-la",
            en: "Do you have…?",
            optionLang: "en",
            options: [
              { text: "Do you have…?" },
              { text: "(I) don’t need it" },
              { text: "How much is it?" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ရှိလား", lSub: "shi-la", r: "Do you have…?" },
              { l: "မလိုဘူး", lSub: "ma-lo-bu", r: "don’t need it" },
              { l: "ထပ်", lSub: "htat", r: "more / again" },
              { l: "ပေးပါ", lSub: "pei-ba", r: "Please give" },
            ],
          },

          // ── Step 3: settling up ───────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ရှင်းမယ်",
            roman: "shin-meh",
            en: "(I’ll) pay / settle up",
            emoji: "🧾",
            note: "What you call across a tea shop when you want the bill. မယ် is the future ending.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဈေးကြီးတယ်",
            roman: "zei-kyi-deh",
            en: "It’s expensive",
            emoji: "💸",
            note: "Literally “the price is big”. ဈေး is the same word as “market”.",
          },
          {
            kind: "learn",
            step: 3,
            my: "လျှော့ပေးပါ",
            roman: "shaw-pei-ba",
            en: "Please lower it",
            emoji: "🤝",
            note: "Haggling is normal at a market stall, not at a tea shop or a restaurant.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဈေးကြီးတယ်",
            roman: "zei-kyi-deh",
            en: "It’s expensive",
            optionLang: "en",
            options: [
              { text: "It’s expensive" },
              { text: "Please lower it" },
              { text: "(I’ll) pay / settle up" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ရှင်းမယ်", lSub: "shin-meh", r: "settle up" },
              { l: "ဈေးကြီးတယ်", lSub: "zei-kyi-deh", r: "expensive" },
              { l: "လျှော့ပေးပါ", lSub: "shaw-pei-ba", r: "Please lower it" },
              { l: "ဘယ်လောက်လဲ", lSub: "bèh-lauk-lèh", r: "How much?" },
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
            note: "At home kids just say မေမေ, like “mom”.",
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

          // ── Step 2: the rest of the household ─────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "သား",
            roman: "tha",
            en: "Son",
            emoji: "👦",
          },
          {
            kind: "learn",
            step: 2,
            my: "သမီး",
            roman: "tha-mi",
            en: "Daughter",
            emoji: "👧",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဇနီး",
            roman: "za-ni",
            en: "Wife",
            emoji: "👰",
          },
          {
            kind: "learn",
            step: 2,
            my: "ခင်ပွန်း",
            roman: "khin-bun",
            en: "Husband",
            emoji: "🤵",
          },
          {
            kind: "listen",
            step: 2,
            my: "သမီး",
            roman: "tha-mi",
            en: "Daughter",
            optionLang: "en",
            options: [{ text: "Daughter" }, { text: "Son" }, { text: "Wife" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "သား", lSub: "tha", r: "Son" },
              { l: "သမီး", lSub: "tha-mi", r: "Daughter" },
              { l: "ဇနီး", lSub: "za-ni", r: "Wife" },
              { l: "ခင်ပွန်း", lSub: "khin-bun", r: "Husband" },
            ],
          },

          // ── Step 3: whose is it ───────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ရဲ့",
            roman: "yéh",
            en: "(possessive: ’s)",
            emoji: "🔗",
            note: "Goes between owner and thing: ကျွန်တော်ရဲ့အိမ် “my house”.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကျွန်တော်ရဲ့မိသားစု",
            roman: "kyun-daw-yéh mi-tha-su",
            en: "My family",
            emoji: "👨‍👩‍👧",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်နှစ်ယောက်လဲ",
            roman: "bèh-hna-yauk-lèh",
            en: "How many people?",
            emoji: "🔢",
            note: "The people counter ယောက် from the Numbers unit, in the question frame ဘယ်နှစ်…လဲ.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဘယ်နှစ်ယောက်လဲ",
            roman: "bèh-hna-yauk-lèh",
            en: "How many people?",
            optionLang: "en",
            options: [{ text: "How many people?" }, { text: "My family" }, { text: "Daughter" }],
            correct: 0,
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “My family”",
            answer: [{ t: "ကျွန်တော်" }, { t: "ရဲ့" }, { t: "မိသားစု" }],
            extras: [{ t: "အမေ" }, { t: "ပါ" }, { t: "လဲ" }],
            my: "ကျွန်တော်ရဲ့မိသားစု",
            roman: "kyun-daw-yéh mi-tha-su",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ရဲ့", lSub: "yéh", r: "’s (possessive)" },
              { l: "ကျွန်တော်ရဲ့မိသားစု", lSub: "kyun-daw-yéh mi-tha-su", r: "My family" },
              { l: "ဘယ်နှစ်ယောက်လဲ", lSub: "bèh-hna-yauk-lèh", r: "How many people?" },
              { l: "မိသားစု", lSub: "mi-tha-su", r: "Family" },
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

          // ── Step 2: age is the whole system ───────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "အသက်",
            roman: "a-thet",
            en: "Age",
            emoji: "🎂",
            note: "Burmese kinship words all encode older-or-younger, so age comes up early and often.",
          },
          {
            kind: "learn",
            step: 2,
            my: "အသက်ဘယ်လောက်လဲ",
            roman: "a-thet bèh-lauk-lèh",
            en: "How old are you?",
            emoji: "❓",
            note: "Not rude here the way it can be elsewhere — it settles which words to use for each other.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ကြီးတယ်",
            roman: "kyi-deh",
            en: "(It’s) big / older",
            emoji: "⬆️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ငယ်တယ်",
            roman: "ngeh-deh",
            en: "(It’s) small / younger",
            emoji: "⬇️",
          },
          {
            kind: "listen",
            step: 2,
            my: "အသက်ဘယ်လောက်လဲ",
            roman: "a-thet bèh-lauk-lèh",
            en: "How old are you?",
            optionLang: "en",
            options: [{ text: "How old are you?" }, { text: "Age" }, { text: "(It’s) big / older" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "အသက်", lSub: "a-thet", r: "Age" },
              { l: "ကြီးတယ်", lSub: "kyi-deh", r: "older" },
              { l: "ငယ်တယ်", lSub: "ngeh-deh", r: "younger" },
              { l: "အစ်ကို", lSub: "a-ko", r: "Older brother" },
            ],
          },

          // ── Step 3: calling people ────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ဦးလေး",
            roman: "u-lei",
            en: "Uncle (older man)",
            emoji: "👨",
            note: "Used for any older man, related or not — a taxi driver, a shopkeeper. Kinship words are how you address strangers politely.",
          },
          {
            kind: "learn",
            step: 3,
            my: "အန်တီ",
            roman: "an-ti",
            en: "Auntie (older woman)",
            emoji: "👩",
            note: "Borrowed from English “auntie” and completely standard.",
          },
          {
            kind: "learn",
            step: 3,
            my: "မောင်လေး",
            roman: "maung-lei",
            en: "Little brother (to a younger man)",
            emoji: "🧑",
          },
          {
            kind: "choice",
            step: 3,
            question: "You want to get an older shopkeeper’s attention. What do you call her?",
            options: [
              { text: "အန်တီ", sub: "an-ti" },
              { text: "မောင်လေး", sub: "maung-lei" },
              { text: "ကလေး", sub: "kha-lei" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "ဦးလေး",
            roman: "u-lei",
            en: "Uncle (older man)",
            optionLang: "en",
            options: [
              { text: "Uncle (older man)" },
              { text: "Auntie (older woman)" },
              { text: "Little brother (to a younger man)" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဦးလေး", lSub: "u-lei", r: "Uncle" },
              { l: "အန်တီ", lSub: "an-ti", r: "Auntie" },
              { l: "မောင်လေး", lSub: "maung-lei", r: "Little brother" },
              { l: "အစ်မ", lSub: "a-ma", r: "Older sister" },
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

          // ── Step 2: how you feel ──────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ပျော်တယ်",
            roman: "pyaw-deh",
            en: "(I’m) happy",
            emoji: "😄",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဝမ်းနည်းတယ်",
            roman: "wun-neh-deh",
            en: "(I’m) sad",
            emoji: "😢",
          },
          {
            kind: "learn",
            step: 2,
            my: "လွမ်းတယ်",
            roman: "lun-deh",
            en: "(I) miss (you)",
            emoji: "💭",
            note: "One word for the whole feeling. It gets used a lot.",
          },
          {
            kind: "listen",
            step: 2,
            my: "လွမ်းတယ်",
            roman: "lun-deh",
            en: "(I) miss (you)",
            optionLang: "en",
            options: [{ text: "(I) miss (you)" }, { text: "(I’m) happy" }, { text: "(I’m) sad" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ပျော်တယ်", lSub: "pyaw-deh", r: "happy" },
              { l: "ဝမ်းနည်းတယ်", lSub: "wun-neh-deh", r: "sad" },
              { l: "လွမ်းတယ်", lSub: "lun-deh", r: "miss (you)" },
              { l: "ချစ်တယ်", lSub: "chit-teh", r: "love" },
            ],
          },

          // ── Step 3: saying it to someone ──────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "မင်း",
            roman: "min",
            en: "you (casual)",
            emoji: "👉",
            note: "The blunt “you”, the partner of ငါ. Friends only — sharp with anyone else.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ငါချစ်တယ်",
            roman: "nga chit-teh",
            en: "I love you",
            emoji: "❤️",
            note: "Burmese usually drops the “you” when it is obvious who you mean.",
          },
          {
            kind: "learn",
            step: 3,
            my: "သတိရတယ်",
            roman: "tha-ti-ya-deh",
            en: "(I) think of / remember (you)",
            emoji: "🕯️",
          },
          {
            kind: "listen",
            step: 3,
            my: "ငါချစ်တယ်",
            roman: "nga chit-teh",
            en: "I love you",
            optionLang: "en",
            options: [
              { text: "I love you" },
              { text: "(I) think of / remember (you)" },
              { text: "you (casual)" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “I love you”",
            answer: [{ t: "ငါ" }, { t: "ချစ်" }, { t: "တယ်" }],
            extras: [{ t: "မင်း" }, { t: "ဘူး" }, { t: "လား" }],
            my: "ငါချစ်တယ်",
            roman: "nga chit-teh",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "မင်း", lSub: "min", r: "you (casual)" },
              { l: "ငါချစ်တယ်", lSub: "nga chit-teh", r: "I love you" },
              { l: "သတိရတယ်", lSub: "tha-ti-ya-deh", r: "think of you" },
              { l: "ကလေး", lSub: "kha-lei", r: "Child" },
            ],
          },
        ],
      },
      {
        id: "everyday-titles",
        title: "Everyday titles",
        emoji: "🎓",
        exercises: [
          {
            kind: "learn",
            my: "ဆရာ",
            roman: "hsa-ya",
            en: "Teacher",
            emoji: "🧑‍🏫",
            note: "Also just a respectful way to address a skilled man, teacher or not — the same trick as ဦးလေး and အန်တီ.",
          },
          {
            kind: "learn",
            my: "ဆရာမ",
            roman: "hsaya-ma",
            en: "Female teacher",
            emoji: "👩‍🏫",
            note: "-မ marks the female form, the same suffix as ဆရာ + မ.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "ဆရာမ",
            promptRoman: "hsaya-ma",
            options: [{ text: "Female teacher" }, { text: "Officer" }, { text: "Older sister" }],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build: “This is a teacher”",
            answer: [
              { t: "ဒါ", sub: "da" },
              { t: "ဆရာ", sub: "hsa-ya" },
              { t: "ပါ", sub: "ba" },
            ],
            extras: [{ t: "ဗိုလ်", sub: "bo" }],
            my: "ဒါ ဆရာပါ",
            roman: "da hsaya-ba",
          },

          // ── Step 2: two more titles you'll hear constantly ────────────
          {
            kind: "learn",
            step: 2,
            my: "ဗိုလ်",
            roman: "bo",
            en: "Officer",
            emoji: "🎖️",
            note: "Spelled with a whole extra syllable (လ်) that nobody says — it’s silent.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘုန်းကြီး",
            roman: "hpoun:-gyi:",
            en: "Monk",
            emoji: "🙏",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဘုန်းကြီး",
            roman: "hpoun:-gyi:",
            en: "Monk",
            optionLang: "en",
            options: [{ text: "Monk" }, { text: "Teacher" }, { text: "Officer" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဆရာ", lSub: "hsa-ya", r: "Teacher" },
              { l: "ဆရာမ", lSub: "hsaya-ma", r: "Female teacher" },
              { l: "ဗိုလ်", lSub: "bo", r: "Officer" },
              { l: "ဘုန်းကြီး", lSub: "hpoun:-gyi:", r: "Monk" },
            ],
          },
        ],
      },
      {
        id: "extended-family",
        title: "Extended family",
        emoji: "👪",
        exercises: [
          {
            kind: "learn",
            my: "တူ",
            roman: "tu",
            en: "Nephew",
            emoji: "🧑",
          },
          {
            kind: "learn",
            my: "တူမ",
            roman: "tu-ma",
            en: "Niece",
            emoji: "🧑",
            note: "Same -မ female-marking suffix you just saw on ဆရာမ.",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "တူမ",
            promptRoman: "tu-ma",
            options: [{ text: "Niece" }, { text: "Nephew" }, { text: "Daughter" }],
            correct: 0,
          },

          // ── Step 2: a generation up ────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "မိဘ",
            roman: "mi-ba",
            en: "Parents",
            emoji: "👨‍👩‍👧",
          },
          {
            kind: "learn",
            step: 2,
            my: "အဖိုးအဖွား",
            roman: "a-hpo:-a-hpwa:",
            en: "Grandparents",
            emoji: "👴👵",
          },
          {
            kind: "listen",
            step: 2,
            my: "မိဘ",
            roman: "mi-ba",
            en: "Parents",
            optionLang: "en",
            options: [{ text: "Parents" }, { text: "Nephew" }, { text: "Niece" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "တူ", lSub: "tu", r: "Nephew" },
              { l: "တူမ", lSub: "tu-ma", r: "Niece" },
              { l: "မိဘ", lSub: "mi-ba", r: "Parents" },
              { l: "အဖိုးအဖွား", lSub: "a-hpo:-a-hpwa:", r: "Grandparents" },
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

          // ── Step 2: more places ───────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဆေးရုံ",
            roman: "hsei-yon",
            en: "Hospital",
            emoji: "🏥",
            note: "ဆေး “medicine” + ရုံ “hall”. Burmese builds a lot of nouns this way.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘဏ်",
            roman: "ban",
            en: "Bank",
            emoji: "🏦",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘူတာ",
            roman: "bu-ta",
            en: "Station",
            emoji: "🚉",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆိုင်",
            roman: "hsaing",
            en: "Shop",
            emoji: "🏪",
            note: "Sticks onto what it sells: လက်ဖက်ရည်ဆိုင် is a tea shop.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဆေးရုံ",
            roman: "hsei-yon",
            en: "Hospital",
            optionLang: "en",
            options: [{ text: "Hospital" }, { text: "Bank" }, { text: "Station" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဆေးရုံ", lSub: "hsei-yon", r: "Hospital" },
              { l: "ဘဏ်", lSub: "ban", r: "Bank" },
              { l: "ဘူတာ", lSub: "bu-ta", r: "Station" },
              { l: "ဆိုင်", lSub: "hsaing", r: "Shop" },
            ],
          },

          // ── Step 3: getting there ─────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ဘတ်စ်ကား",
            roman: "bat-sa-ka",
            en: "Bus",
            emoji: "🚌",
          },
          {
            kind: "learn",
            step: 3,
            my: "တက္ကစီ",
            roman: "tet-ka-si",
            en: "Taxi",
            emoji: "🚕",
          },
          {
            kind: "learn",
            step: 3,
            my: "လမ်းလျှောက်",
            roman: "lan-shauk",
            en: "(to) walk",
            emoji: "🚶",
            note: "လမ်း “road” again — literally “road-tread”.",
          },
          {
            kind: "listen",
            step: 3,
            my: "တက္ကစီ",
            roman: "tet-ka-si",
            en: "Taxi",
            optionLang: "en",
            options: [{ text: "Taxi" }, { text: "Bus" }, { text: "(to) walk" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဘတ်စ်ကား", lSub: "bat-sa-ka", r: "Bus" },
              { l: "တက္ကစီ", lSub: "tet-ka-si", r: "Taxi" },
              { l: "လမ်းလျှောက်", lSub: "lan-shauk", r: "walk" },
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

          // ── Step 2: near and far ──────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "နီးတယ်",
            roman: "ni-deh",
            en: "(It’s) near",
            emoji: "📍",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဝေးတယ်",
            roman: "wei-deh",
            en: "(It’s) far",
            emoji: "🛣️",
          },
          {
            kind: "learn",
            step: 2,
            my: "အနား",
            roman: "a-na",
            en: "nearby / beside",
            emoji: "🧭",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "ဝေးတယ်",
            promptRoman: "wei-deh",
            options: [{ text: "(It’s) far" }, { text: "(It’s) near" }, { text: "nearby / beside" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "နီးတယ်",
            roman: "ni-deh",
            en: "(It’s) near",
            optionLang: "en",
            options: [{ text: "(It’s) near" }, { text: "(It’s) far" }, { text: "nearby / beside" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "နီးတယ်", lSub: "ni-deh", r: "near" },
              { l: "ဝေးတယ်", lSub: "wei-deh", r: "far" },
              { l: "အနား", lSub: "a-na", r: "nearby" },
              { l: "ဒီမှာ", lSub: "di-hma", r: "Here" },
            ],
          },

          // ── Step 3: asking the way ────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်လိုသွားရမလဲ",
            roman: "bèh-lo thwa-ya-ma-lèh",
            en: "How do I get there?",
            emoji: "🗺️",
          },
          {
            kind: "learn",
            step: 3,
            my: "လိုက်ပြပါ",
            roman: "laik-pya-ba",
            en: "Please show me the way",
            emoji: "👉",
          },
          {
            kind: "learn",
            step: 3,
            my: "ပျောက်နေတယ်",
            roman: "pyauk-nei-deh",
            en: "(I’m) lost",
            emoji: "😵",
            note: "နေ marks something in progress — the same ending as “I’m eating”.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ပျောက်နေတယ်",
            roman: "pyauk-nei-deh",
            en: "(I’m) lost",
            optionLang: "en",
            options: [
              { text: "(I’m) lost" },
              { text: "How do I get there?" },
              { text: "Please show me the way" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဘယ်လိုသွားရမလဲ", lSub: "bèh-lo thwa-ya-ma-lèh", r: "How do I get there?" },
              { l: "လိုက်ပြပါ", lSub: "laik-pya-ba", r: "Please show me" },
              { l: "ပျောက်နေတယ်", lSub: "pyauk-nei-deh", r: "(I’m) lost" },
              { l: "ဘယ်မှာလဲ", lSub: "bèh-hma-lèh", r: "Where is…?" },
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

          // ── Step 2: more directions ───────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "တည့်တည့်",
            roman: "téh-téh",
            en: "Straight ahead",
            emoji: "⬆️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ကွေ့ပါ",
            roman: "kwéh-ba",
            en: "Please turn",
            emoji: "↩️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ပြန်",
            roman: "pyan",
            en: "back / return",
            emoji: "🔙",
          },
          {
            kind: "listen",
            step: 2,
            my: "တည့်တည့်",
            roman: "téh-téh",
            en: "Straight ahead",
            optionLang: "en",
            options: [{ text: "Straight ahead" }, { text: "Please turn" }, { text: "back / return" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "တည့်တည့်", lSub: "téh-téh", r: "Straight ahead" },
              { l: "ကွေ့ပါ", lSub: "kwéh-ba", r: "Please turn" },
              { l: "ပြန်", lSub: "pyan", r: "back / return" },
              { l: "ဘယ်ဘက်", lSub: "bèh-bet", r: "Left" },
            ],
          },

          // ── Step 3: in the taxi ───────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ဒီမှာရပ်ပါ",
            roman: "di-hma yat-pa",
            en: "Please stop here",
            emoji: "🛑",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်ဘက်ကွေ့ပါ",
            roman: "bèh-bet kwéh-ba",
            en: "Please turn left",
            emoji: "⬅️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဖြည်းဖြည်းသွားပါ",
            roman: "hpyei-hpyei thwa-ba",
            en: "Please go slowly",
            emoji: "🐢",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဒီမှာရပ်ပါ",
            roman: "di-hma yat-pa",
            en: "Please stop here",
            optionLang: "en",
            options: [
              { text: "Please stop here" },
              { text: "Please turn left" },
              { text: "Please go slowly" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            step: 3,
            question: "Build “Please turn left”",
            answer: [{ t: "ဘယ်ဘက်" }, { t: "ကွေ့" }, { t: "ပါ" }],
            extras: [{ t: "ညာဘက်" }, { t: "ရပ်" }, { t: "တယ်" }],
            my: "ဘယ်ဘက်ကွေ့ပါ",
            roman: "bèh-bet kwéh-ba",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဒီမှာရပ်ပါ", lSub: "di-hma yat-pa", r: "Stop here" },
              { l: "ဘယ်ဘက်ကွေ့ပါ", lSub: "bèh-bet kwéh-ba", r: "Turn left" },
              { l: "ဖြည်းဖြည်းသွားပါ", lSub: "hpyei-hpyei thwa-ba", r: "Go slowly" },
              { l: "ညာဘက်", lSub: "nya-bet", r: "Right" },
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

          // ── Step 2: when, exactly ─────────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "အရင်",
            roman: "a-yin",
            en: "before / earlier",
            emoji: "⏪",
          },
          {
            kind: "learn",
            step: 2,
            my: "နောက်မှ",
            roman: "nauk-hma",
            en: "later",
            emoji: "⏩",
            note: "နောက်မှတွေ့မယ် — “see you later”.",
          },
          {
            kind: "learn",
            step: 2,
            my: "မကြာခင်",
            roman: "ma-kya-khin",
            en: "soon",
            emoji: "⏳",
          },
          {
            kind: "listen",
            step: 2,
            my: "နောက်မှ",
            roman: "nauk-hma",
            en: "later",
            optionLang: "en",
            options: [{ text: "later" }, { text: "before / earlier" }, { text: "soon" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "အရင်", lSub: "a-yin", r: "before" },
              { l: "နောက်မှ", lSub: "nauk-hma", r: "later" },
              { l: "မကြာခင်", lSub: "ma-kya-khin", r: "soon" },
              { l: "အခု", lSub: "a-khu", r: "Now" },
            ],
          },

          // ── Step 3: telling the time ──────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "နာရီ",
            roman: "na-yi",
            en: "hour / o’clock / clock",
            emoji: "🕐",
            note: "One word for the clock, the hour and the watch on your wrist.",
          },
          {
            kind: "learn",
            step: 3,
            my: "မိနစ်",
            roman: "mi-nit",
            en: "minute",
            emoji: "⏱️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်နှစ်နာရီလဲ",
            roman: "bèh-hna-na-yi-lèh",
            en: "What time is it?",
            emoji: "🕰️",
            note: "The ဘယ်နှစ်…လဲ counting frame again, this time with နာရီ.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဘယ်နှစ်နာရီလဲ",
            roman: "bèh-hna-na-yi-lèh",
            en: "What time is it?",
            optionLang: "en",
            options: [
              { text: "What time is it?" },
              { text: "hour / o’clock / clock" },
              { text: "minute" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "နာရီ", lSub: "na-yi", r: "hour / clock" },
              { l: "မိနစ်", lSub: "mi-nit", r: "minute" },
              { l: "ဘယ်နှစ်နာရီလဲ", lSub: "bèh-hna-na-yi-lèh", r: "What time is it?" },
              { l: "ဒီနေ့", lSub: "di-nei", r: "Today" },
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

          // ── Step 2: through the day ───────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "မနက်စာ",
            roman: "ma-net-sa",
            en: "Breakfast",
            emoji: "🍳",
            note: "မနက် “morning” + စာ. The other meals follow the same pattern.",
          },
          {
            kind: "learn",
            step: 2,
            my: "နေ့လယ်စာ",
            roman: "nei-leh-sa",
            en: "Lunch",
            emoji: "🍛",
          },
          {
            kind: "learn",
            step: 2,
            my: "ညစာ",
            roman: "nya-sa",
            en: "Dinner",
            emoji: "🍲",
          },
          {
            kind: "listen",
            step: 2,
            my: "မနက်စာ",
            roman: "ma-net-sa",
            en: "Breakfast",
            optionLang: "en",
            options: [{ text: "Breakfast" }, { text: "Lunch" }, { text: "Dinner" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "မနက်စာ", lSub: "ma-net-sa", r: "Breakfast" },
              { l: "နေ့လယ်စာ", lSub: "nei-leh-sa", r: "Lunch" },
              { l: "ညစာ", lSub: "nya-sa", r: "Dinner" },
              { l: "မနက်", lSub: "ma-net", r: "Morning" },
            ],
          },

          // ── Step 3: sleeping and waking ───────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "အိပ်တယ်",
            roman: "eik-teh",
            en: "(I) sleep",
            emoji: "😴",
          },
          {
            kind: "learn",
            step: 3,
            my: "နိုးတယ်",
            roman: "no-deh",
            en: "(I) wake up",
            emoji: "🌅",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကောင်းသောညပါ",
            roman: "kaung-thaw-nya-ba",
            en: "Good night",
            emoji: "🌙",
            note: "A written-register phrase — warm in a message, a little formal out loud.",
          },
          {
            kind: "listen",
            step: 3,
            my: "အိပ်တယ်",
            roman: "eik-teh",
            en: "(I) sleep",
            optionLang: "en",
            options: [{ text: "(I) sleep" }, { text: "(I) wake up" }, { text: "Good night" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "အိပ်တယ်", lSub: "eik-teh", r: "sleep" },
              { l: "နိုးတယ်", lSub: "no-deh", r: "wake up" },
              { l: "ကောင်းသောညပါ", lSub: "kaung-thaw-nya-ba", r: "Good night" },
              { l: "ညနေ", lSub: "nya-nei", r: "Evening" },
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

          // ── Step 2: the missing days ──────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "အင်္ဂါနေ့",
            roman: "in-ga-nei",
            en: "Tuesday",
            emoji: "📅",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဗုဒ္ဓဟူးနေ့",
            roman: "boke-da-hu-nei",
            en: "Wednesday",
            emoji: "📅",
          },
          {
            kind: "learn",
            step: 2,
            my: "ကြာသပတေးနေ့",
            roman: "kya-tha-ba-dei-nei",
            en: "Thursday",
            emoji: "📅",
            note: "That is the week complete. Each day is named for a planet, and the day you were born on still matters in Myanmar.",
          },
          {
            kind: "listen",
            step: 2,
            my: "အင်္ဂါနေ့",
            roman: "in-ga-nei",
            en: "Tuesday",
            optionLang: "en",
            options: [{ text: "Tuesday" }, { text: "Wednesday" }, { text: "Thursday" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "အင်္ဂါနေ့", lSub: "in-ga-nei", r: "Tuesday" },
              { l: "ဗုဒ္ဓဟူးနေ့", lSub: "boke-da-hu-nei", r: "Wednesday" },
              { l: "ကြာသပတေးနေ့", lSub: "kya-tha-ba-dei-nei", r: "Thursday" },
              { l: "တနင်္လာနေ့", lSub: "ta-nin-la-nei", r: "Monday" },
            ],
          },

          // ── Step 3: making a plan ─────────────────────────────────────
          {
            kind: "learn",
            step: 3,
            my: "အားတယ်",
            roman: "a-deh",
            en: "(I’m) free",
            emoji: "🆓",
          },
          {
            kind: "learn",
            step: 3,
            my: "အလုပ်များတယ်",
            roman: "a-lote-mya-deh",
            en: "(I’m) busy",
            emoji: "😮‍💨",
            note: "Literally “work is much”.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်တော့လဲ",
            roman: "bèh-dáw-lèh",
            en: "When?",
            emoji: "❓",
          },
          {
            kind: "listen",
            step: 3,
            my: "အလုပ်များတယ်",
            roman: "a-lote-mya-deh",
            en: "(I’m) busy",
            optionLang: "en",
            options: [{ text: "(I’m) busy" }, { text: "(I’m) free" }, { text: "When?" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "အားတယ်", lSub: "a-deh", r: "free" },
              { l: "အလုပ်များတယ်", lSub: "a-lote-mya-deh", r: "busy" },
              { l: "ဘယ်တော့လဲ", lSub: "bèh-dáw-lèh", r: "When?" },
              { l: "တွေ့မယ်", lSub: "twei-meh", r: "(We’ll) meet" },
            ],
          },
        ],
      },
    ],
  },
  {
    // The register a textbook leaves out: the particles that make speech sound
    // like speech, the intensifiers people actually use, and the greeting
    // everyone opens with. Deliberately the last unit — none of it makes sense
    // until you have sentences to attach it to.
    id: "real-talk",
    title: "Real Talk",
    my: "နေ့စဉ်စကား",
    color: "var(--coral)",
    lessons: [
      {
        id: "little-words",
        title: "The little words",
        emoji: "💭",
        exercises: [
          {
            kind: "learn",
            my: "နော်",
            roman: "naw",
            en: "…right? / …okay?",
            emoji: "🤝",
            note: "Stuck on the end of a sentence to check the other person is with you. Burmese speech is full of it; textbooks rarely mention it.",
          },
          {
            kind: "choice",
            question: "You want to end a sentence with “…right?”. Which particle?",
            options: [
              { text: "နော်", sub: "naw" },
              { text: "ပေါ့", sub: "paw" },
              { text: "လေ", sub: "lay" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ပေါ့",
            roman: "paw",
            en: "…of course / obviously",
            emoji: "🙄",
            note: "Marks what you’re saying as self-evident. Warm with friends, dismissive with strangers.",
          },
          {
            kind: "learn",
            my: "လေ",
            roman: "lay",
            en: "(softener)",
            emoji: "☁️",
            note: "Takes the edge off a statement, roughly “you know”. Hard to translate, everywhere in real speech.",
          },
          {
            kind: "listen",
            my: "ပေါ့",
            roman: "paw",
            en: "…of course / obviously",
            // Sound to form is the honest test for these three: their English
            // glosses are labels for a function, so a meaning drill over them
            // would just ask which label was assigned to which particle.
            keepScript: true,
            options: [
              { text: "ပေါ့", sub: "paw" },
              { text: "နော်", sub: "naw" },
              { text: "လေ", sub: "lay" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "အိုကေ",
            roman: "o-ke",
            en: "OK",
            emoji: "👌",
            note: "Straight from English and completely naturalised. You’ll hear it constantly.",
          },
          {
            kind: "listen",
            my: "အိုကေ",
            roman: "o-ke",
            en: "OK",
            optionLang: "en",
            // အိုကေ is a loanword and does have a real translation, so it can
            // be tested on meaning — but not against the particles, whose
            // "meanings" are labels for a function rather than translations.
            options: [{ text: "OK" }, { text: "Thank you" }, { text: "I don’t know" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "နော်", lSub: "naw", r: "…right?" },
              { l: "ပေါ့", lSub: "paw", r: "…of course" },
              { l: "လေ", lSub: "lay", r: "(softener)" },
              { l: "အိုကေ", lSub: "o-ke", r: "OK" },
            ],
          },

          // ── Step 2: talking to friends ────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ကွာ",
            roman: "kwa",
            en: "(familiar ending)",
            emoji: "😄",
            note: "Close friends only. Warm between mates, rude to a stranger or an elder — worth knowing precisely so you don’t misfire.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဟုတ်ပြီ",
            roman: "hote-bi",
            en: "Got it / alright",
            emoji: "👍",
            note: "The ပြီ ending marks a change of state: it wasn’t settled, now it is.",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this mean?",
            promptMy: "ဟုတ်ပြီ",
            promptRoman: "hote-bi",
            options: [
              { text: "Got it / alright" },
              { text: "(familiar ending)" },
              { text: "I don’t know" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာမှမဟုတ်ဘူး",
            roman: "ba-hma ma-hote-bu",
            en: "It’s nothing / no worries",
            emoji: "🤙",
            note: "What you say back to ကျေးဇူးတင်ပါတယ်. Same မ…ဘူး negation, with ဘာမှ “nothing at all”.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဘာမှမဟုတ်ဘူး",
            roman: "ba-hma ma-hote-bu",
            en: "It’s nothing / no worries",
            optionLang: "en",
            options: [
              { text: "It’s nothing / no worries" },
              { text: "Got it / alright" },
              { text: "OK" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ကွာ", lSub: "kwa", r: "(familiar ending)" },
              { l: "ဟုတ်ပြီ", lSub: "hote-bi", r: "Got it" },
              { l: "ဘာမှမဟုတ်ဘူး", lSub: "ba-hma ma-hote-bu", r: "It’s nothing" },
              { l: "အိုကေ", lSub: "o-ke", r: "OK" },
            ],
          },
        ],
      },
      {
        id: "how-people-really-greet",
        title: "How people really greet",
        emoji: "🍚",
        exercises: [
          {
            kind: "learn",
            my: "စားပြီးပြီလား",
            roman: "sa-bi-bi-la",
            en: "Have you eaten?",
            emoji: "🍚",
            note: "The real everyday opener, far more common than မင်္ဂလာပါ between people who know each other. It’s a greeting, not an invitation — “I’m fine” energy, not a dinner plan.",
          },
          {
            kind: "learn",
            my: "စားပြီးပြီ",
            roman: "sa-bi-bi",
            en: "I’ve eaten",
            emoji: "😋",
            note: "The expected answer, whether or not it’s true.",
          },
          {
            kind: "choice",
            question: "Someone greets you with “စားပြီးပြီလား”. What are they asking?",
            options: [
              { text: "Have you eaten?" },
              { text: "Where are you going?" },
              { text: "How much is it?" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "ဘယ်သွားမလဲ",
            roman: "bèh thwa-ma-lèh",
            en: "Where are you off to?",
            emoji: "🚶",
            note: "The other standard opener. Also mostly phatic — a nod in passing, not an interrogation.",
          },
          {
            kind: "listen",
            my: "စားပြီးပြီလား",
            roman: "sa-bi-bi-la",
            en: "Have you eaten?",
            optionLang: "en",
            options: [
              { text: "Have you eaten?" },
              { text: "Where are you off to?" },
              { text: "I’ve eaten" },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဘယ်သွားမလဲ",
            roman: "bèh thwa-ma-lèh",
            en: "Where are you off to?",
            options: [
              { text: "ဘယ်သွားမလဲ", sub: "bèh thwa-ma-lèh" },
              { text: "စားပြီးပြီလား", sub: "sa-bi-bi-la" },
              { text: "ဟုတ်ပြီ", sub: "hote-bi" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "စားပြီးပြီလား", lSub: "sa-bi-bi-la", r: "Have you eaten?" },
              { l: "စားပြီးပြီ", lSub: "sa-bi-bi", r: "I’ve eaten" },
              { l: "ဘယ်သွားမလဲ", lSub: "bèh thwa-ma-lèh", r: "Where are you off to?" },
              { l: "အိုကေ", lSub: "o-ke", r: "OK" },
            ],
          },

          // ── Step 2: small talk that goes nowhere ──────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဘာလုပ်နေလဲ",
            roman: "ba lote-nei-lèh",
            en: "What are you up to?",
            emoji: "👀",
            note: "နေ marks it as in-progress — “what are you doing right now”.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာမှမလုပ်ဘူး",
            roman: "ba-hma ma-lote-bu",
            en: "Nothing much",
            emoji: "😌",
            note: "The expected answer. Same ဘာမှ…ဘူး frame as ဘာမှမဟုတ်ဘူး.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဟုတ်တယ်နော်",
            roman: "hote-teh-naw",
            en: "Right? / Isn’t it?",
            emoji: "🤙",
            note: "The နော် tag from the last lesson, doing its most common job.",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဘာလုပ်နေလဲ",
            roman: "ba lote-nei-lèh",
            en: "What are you up to?",
            optionLang: "en",
            options: [
              { text: "What are you up to?" },
              { text: "Nothing much" },
              { text: "Right? / Isn’t it?" },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဘာလုပ်နေလဲ", lSub: "ba lote-nei-lèh", r: "What are you up to?" },
              { l: "ဘာမှမလုပ်ဘူး", lSub: "ba-hma ma-lote-bu", r: "Nothing much" },
              { l: "ဟုတ်တယ်နော်", lSub: "hote-teh-naw", r: "Right?" },
              { l: "စားပြီးပြီလား", lSub: "sa-bi-bi-la", r: "Have you eaten?" },
            ],
          },
        ],
      },
      {
        id: "saying-it-with-feeling",
        title: "Saying it with feeling",
        emoji: "🔥",
        exercises: [
          {
            kind: "learn",
            my: "အရမ်း",
            roman: "a-yan",
            en: "very / so",
            emoji: "💯",
            note: "Goes in front of what it intensifies: အရမ်းကောင်းတယ် “so good”.",
          },
          {
            kind: "learn",
            my: "တော်တော်",
            roman: "taw-taw",
            en: "quite / pretty",
            emoji: "🙂",
            note: "A notch below အရမ်း. Same position, milder claim.",
          },
          {
            kind: "choice",
            question: "Which one is the stronger “very”?",
            options: [
              { text: "အရမ်း", sub: "a-yan" },
              { text: "တော်တော်", sub: "taw-taw" },
              { text: "လေ", sub: "lay" },
            ],
            correct: 0,
          },
          {
            kind: "learn",
            my: "အရမ်းကောင်းတယ်",
            roman: "a-yan kaung-deh",
            en: "It’s so good",
            emoji: "🤩",
          },
          {
            kind: "learn",
            my: "မိုက်တယ်",
            roman: "maik-teh",
            en: "Cool / awesome",
            emoji: "😎",
            note: "Casual praise, the sort of word a phrasebook skips.",
          },
          {
            kind: "listen",
            my: "မိုက်တယ်",
            roman: "maik-teh",
            en: "Cool / awesome",
            optionLang: "en",
            options: [
              { text: "Cool / awesome" },
              { text: "very / so" },
              { text: "quite / pretty" },
            ],
            correct: 0,
          },
          {
            kind: "assemble",
            question: "Build “It’s so good”",
            answer: [{ t: "အရမ်း" }, { t: "ကောင်း" }, { t: "တယ်" }],
            extras: [{ t: "တော်တော်" }, { t: "ဘူး" }, { t: "လား" }],
            my: "အရမ်းကောင်းတယ်",
            roman: "a-yan kaung-deh",
          },
          {
            kind: "match",
            pairs: [
              { l: "အရမ်း", lSub: "a-yan", r: "very / so" },
              { l: "တော်တော်", lSub: "taw-taw", r: "quite / pretty" },
              { l: "မိုက်တယ်", lSub: "maik-teh", r: "Cool / awesome" },
              { l: "အရမ်းကောင်းတယ်", lSub: "a-yan kaung-deh", r: "It’s so good" },
            ],
          },

          // ── Step 2: when it goes wrong ────────────────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဆိုးတယ်",
            roman: "so-deh",
            en: "(It’s) bad",
            emoji: "👎",
          },
          {
            kind: "learn",
            step: 2,
            my: "စိတ်ညစ်တယ်",
            roman: "seik-nyit-teh",
            en: "(I’m) fed up",
            emoji: "😩",
            note: "စိတ် is “mind” and starts a whole family of feeling words.",
          },
          {
            kind: "learn",
            step: 2,
            my: "အံ့သြတယ်",
            roman: "an-aw-deh",
            en: "(I’m) amazed",
            emoji: "🤯",
          },
          {
            kind: "listen",
            step: 2,
            my: "စိတ်ညစ်တယ်",
            roman: "seik-nyit-teh",
            en: "(I’m) fed up",
            optionLang: "en",
            options: [{ text: "(I’m) fed up" }, { text: "(It’s) bad" }, { text: "(I’m) amazed" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဆိုးတယ်", lSub: "so-deh", r: "bad" },
              { l: "စိတ်ညစ်တယ်", lSub: "seik-nyit-teh", r: "fed up" },
              { l: "အံ့သြတယ်", lSub: "an-aw-deh", r: "amazed" },
              { l: "မိုက်တယ်", lSub: "maik-teh", r: "Cool" },
            ],
          },
        ],
      },
    ],
  },
  {
    // The script-only capstone. Every lesson here is `scriptOnly`, and they
    // are gathered into a unit rather than trailing off the end of Real Talk
    // because there are now enough of them to be a destination: "the part of
    // the course you reach once you can read" is a milestone worth being able
    // to see on the path, not a lesson hiding behind an unrelated title.
    //
    // What makes this much material shippable without romanization is that
    // every string below is one of the user's own recordings, so the check on
    // a decoding is the audio rather than a Latin-letter gloss. Loanwords and
    // proper nouns go further still: the meaning *is* the pronunciation, so
    // landing on "coffee" from ကော်ဖီ verifies itself, and a romanization
    // beside it would have given the answer away rather than confirmed it.
    id: "read-alone",
    title: "Read It Yourself",
    my: "ကိုယ်တိုင်ဖတ်",
    color: "var(--gold)",
    lessons: [
      {
        id: "reading-solo",
        title: "Reading solo",
        emoji: "📖",
        // No romanization anywhere below — script, audio and meaning only.
        // See Lesson.scriptOnly: grading never reads `roman`, so this changes
        // nothing about correctness, only whether there's a Latin-letter
        // crutch to lean on. Sentences are the user's own recordings, real
        // conversational Burmese (IDEAS.md Round 21) that would otherwise
        // have needed a confident romanization to ship — here that
        // confidence isn't needed at all.
        scriptOnly: true,
        exercises: [
          {
            kind: "learn",
            my: "ပြန်ပြောပါ။",
            en: "Please say that again.",
            emoji: "🔁",
            note: "The one phrase worth memorizing before any of the others — you will need it constantly.",
          },
          {
            kind: "learn",
            my: "မှန်သလား။",
            en: "Is that correct?",
            emoji: "❓",
          },
          {
            kind: "choice",
            question: "What does this mean?",
            promptMy: "မှန်သလား။",
            options: [
              { text: "Is that correct?" },
              { text: "Please say that again." },
              { text: "That's a market." },
            ],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ပြန်ပြောပါ။",
            en: "Please say that again.",
            optionLang: "en",
            options: [
              { text: "Please say that again." },
              { text: "Is that correct?" },
              { text: "That's a market." },
            ],
            correct: 0,
          },

          // ── Step 2: a couple more everyday lines ───────────────────────
          {
            kind: "learn",
            step: 2,
            my: "ဒါ စျေးပါ။",
            en: "That's a market.",
            emoji: "🏪",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာ စားသလဲ။",
            en: "What did he eat?",
            emoji: "🍽️",
          },
          {
            kind: "listen",
            step: 2,
            my: "ဘာ စားသလဲ။",
            en: "What did he eat?",
            optionLang: "en",
            options: [
              { text: "What did he eat?" },
              { text: "That's a market." },
              { text: "I'm going to swim." },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ပြန်ပြောပါ။", r: "Please say that again." },
              { l: "မှန်သလား။", r: "Is that correct?" },
              { l: "ဒါ စျေးပါ။", r: "That's a market." },
              { l: "ဘာ စားသလဲ။", r: "What did he eat?" },
            ],
          },

          // ── Step 3: asking about people and places ─────────────────────
          {
            kind: "learn",
            step: 3,
            my: "ရေ ကူးမယ်။",
            en: "I'm going to swim.",
            emoji: "🏊",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဆေး စားသလား။",
            en: "Did he take the medicine?",
            emoji: "💊",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘယ်နိုင်ငံက လာသလဲ။",
            en: "What country does she come from?",
            emoji: "🌍",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဒါ ဗမာလို ဘယ်လို ခေါ်သလဲ။",
            en: "What's that called in Burmese?",
            emoji: "🗣️",
            note: "The question that gets you the rest of the vocabulary this course doesn't cover.",
          },
          {
            kind: "listen",
            step: 3,
            my: "ဘယ်နိုင်ငံက လာသလဲ။",
            en: "What country does she come from?",
            optionLang: "en",
            options: [
              { text: "What country does she come from?" },
              { text: "Did he take the medicine?" },
              { text: "I'm going to swim." },
            ],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ရေ ကူးမယ်။", r: "I'm going to swim." },
              { l: "ဆေး စားသလား။", r: "Did he take the medicine?" },
              { l: "ဘယ်နိုင်ငံက လာသလဲ။", r: "What country does she come from?" },
              { l: "ဒါ ဗမာလို ဘယ်လို ခေါ်သလဲ။", r: "What's that called in Burmese?" },
            ],
          },
        ],
      },
      {
        id: "loanwords",
        title: "Words you already know",
        emoji: "🔤",
        // The gentlest possible reading without romanization, and the reason this
        // unit can do without it at all: these words were English before they were
        // Burmese, so decoding one and hearing what you just said is its own answer
        // key. Sound out ဒေါ်လာ, arrive at "dollar", and the letters have proved
        // themselves — a romanization printed beside it would have given the answer
        // away instead of confirming it.
        //
        // Optional, because the payoff is lopsided: "this word was English all
        // along" is a revelation to a beginner sounding out their first
        // syllables and barely news to someone who already reads the script,
        // and this unit is aimed at the second. Worth having, not worth
        // charging everyone to get past.
        scriptOnly: true,
        optional: true,
        exercises: [
          // ── Money, which is where a traveller meets these first ──
          {
            kind: "learn",
            my: "ဒေါ်လာ",
            en: "Dollar",
            emoji: "💵",
          },
          {
            kind: "learn",
            my: "ပေါင်",
            en: "Pound",
            emoji: "💷",
          },
          {
            kind: "learn",
            my: "ယန်း",
            en: "Yen",
            emoji: "💴",
          },
          {
            kind: "learn",
            my: "ဆင့်",
            en: "Cent",
            emoji: "🪙",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "ဒေါ်လာ",
            options: [{ text: "Dollar" }, { text: "Pound" }, { text: "Yen" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဆင့်",
            en: "Cent",
            optionLang: "en",
            options: [{ text: "Cent" }, { text: "Dollar" }, { text: "Pound" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ဒေါ်လာ", r: "Dollar" },
              { l: "ပေါင်", r: "Pound" },
              { l: "ယန်း", r: "Yen" },
              { l: "ဆင့်", r: "Cent" },
            ],
          },

          // ── Clock and calendar ──
          {
            kind: "learn",
            step: 2,
            my: "စက္ကန့်",
            en: "Second",
            emoji: "⏱️",
          },
          {
            kind: "learn",
            step: 2,
            my: "စက်တင်ဘာ",
            en: "September",
            emoji: "📅",
          },
          {
            kind: "learn",
            step: 2,
            my: "အောက်တိုဘာ",
            en: "October",
            emoji: "🍂",
          },
          {
            kind: "learn",
            step: 2,
            my: "နိုဝင်ဘာ",
            en: "November",
            emoji: "🌧️",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "စက္ကန့်",
            options: [{ text: "Second" }, { text: "September" }, { text: "October" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "နိုဝင်ဘာ",
            en: "November",
            optionLang: "en",
            options: [{ text: "November" }, { text: "Second" }, { text: "September" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "စက္ကန့်", r: "Second" },
              { l: "စက်တင်ဘာ", r: "September" },
              { l: "အောက်တိုဘာ", r: "October" },
              { l: "နိုဝင်ဘာ", r: "November" },
            ],
          },

          // ── Things you are carrying right now ──
          {
            kind: "learn",
            step: 3,
            my: "ပတ်စပို့",
            en: "Passport",
            emoji: "🛂",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘက်ထရီ",
            en: "Battery",
            emoji: "🔋",
          },
          {
            kind: "learn",
            step: 3,
            my: "ပို့စကတ်",
            en: "Postcard",
            emoji: "📮",
          },
          {
            kind: "learn",
            step: 3,
            my: "ပိုစတာ",
            en: "Poster",
            emoji: "🖼️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကိတ်",
            en: "Cake",
            emoji: "🍰",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ပတ်စပို့",
            options: [{ text: "Passport" }, { text: "Battery" }, { text: "Postcard" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "ကိတ်",
            en: "Cake",
            optionLang: "en",
            options: [{ text: "Cake" }, { text: "Passport" }, { text: "Battery" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ပတ်စပို့", r: "Passport" },
              { l: "ဘက်ထရီ", r: "Battery" },
              { l: "ပို့စကတ်", r: "Postcard" },
              { l: "ပိုစတာ", r: "Poster" },
            ],
          },

          // ── A loanword inside a whole sentence ──
          {
            kind: "learn",
            step: 4,
            my: "ဒါ ကော်ဖီပါ။",
            en: "That's coffee.",
            emoji: "☕",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဆယ် စက္ကန့်",
            en: "Ten seconds",
            emoji: "⏲️",
          },
          {
            kind: "learn",
            step: 4,
            my: "ပတ်စပို့ ဘယ်မှာ ထားမလဲ။",
            en: "Where will you put your passport?",
            emoji: "🛄",
          },
          {
            kind: "learn",
            step: 4,
            my: "ပို့စကတ် ပို့ချင်ပါတယ်။",
            en: "I'd like to send a postcard.",
            emoji: "✉️",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "ဒါ ကော်ဖီပါ။",
            options: [{ text: "That's coffee." }, { text: "Ten seconds" }, { text: "Where will you put your passport?" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "ပို့စကတ် ပို့ချင်ပါတယ်။",
            en: "I'd like to send a postcard.",
            optionLang: "en",
            options: [{ text: "I'd like to send a postcard." }, { text: "That's coffee." }, { text: "Ten seconds" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "ဒါ ကော်ဖီပါ။", r: "That's coffee." },
              { l: "ဆယ် စက္ကန့်", r: "Ten seconds" },
              { l: "ပတ်စပို့ ဘယ်မှာ ထားမလဲ။", r: "Where will you put your passport?" },
              { l: "ပို့စကတ် ပို့ချင်ပါတယ်။", r: "I'd like to send a postcard." },
            ],
          },
        ],
      },
      {
        id: "on-the-map",
        title: "On the map",
        emoji: "🌍",
        // Country and city names work the same way the loanwords do — the meaning
        // is the pronunciation — but they add the first piece of real word-building
        // in the unit: နိုင်ငံ "country" on the end of a borrowed name, which is a
        // suffix you can then read off any map.
        scriptOnly: true,
        exercises: [
          // ── Places big enough to need no suffix ──
          {
            kind: "learn",
            my: "ဂျပန်",
            en: "Japan",
            emoji: "🇯🇵",
          },
          {
            kind: "learn",
            my: "ဂျာမနီ",
            en: "Germany",
            emoji: "🇩🇪",
          },
          {
            kind: "learn",
            my: "အာရှ",
            en: "Asia",
            emoji: "🌏",
          },
          {
            kind: "learn",
            my: "အမေရိက",
            en: "America",
            emoji: "🗽",
          },
          {
            kind: "learn",
            my: "အာဖရိက",
            en: "Africa",
            emoji: "🌍",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "ဂျပန်",
            options: [{ text: "Japan" }, { text: "Germany" }, { text: "Asia" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "အာဖရိက",
            en: "Africa",
            optionLang: "en",
            options: [{ text: "Africa" }, { text: "Japan" }, { text: "Germany" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ဂျပန်", r: "Japan" },
              { l: "ဂျာမနီ", r: "Germany" },
              { l: "အာရှ", r: "Asia" },
              { l: "အမေရိက", r: "America" },
            ],
          },

          // ── နိုင်ငံ on the end: "country" ──
          {
            kind: "learn",
            step: 2,
            my: "ပြင်သစ်နိုင်ငံ",
            en: "France",
            emoji: "🇫🇷",
            note: "The last two syllables are နိုင်ငံ, \"country\". Once you can see it on the end of a name, most of a world map becomes readable.",
          },
          {
            kind: "learn",
            step: 2,
            my: "စပိန်နိုင်ငံ",
            en: "Spain",
            emoji: "🇪🇸",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆွီဒင်နိုင်ငံ",
            en: "Sweden",
            emoji: "🇸🇪",
          },
          {
            kind: "learn",
            step: 2,
            my: "နော်ဝေးနိုင်ငံ",
            en: "Norway",
            emoji: "🇳🇴",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "ပြင်သစ်နိုင်ငံ",
            options: [{ text: "France" }, { text: "Spain" }, { text: "Sweden" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "နော်ဝေးနိုင်ငံ",
            en: "Norway",
            optionLang: "en",
            options: [{ text: "Norway" }, { text: "France" }, { text: "Spain" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ပြင်သစ်နိုင်ငံ", r: "France" },
              { l: "စပိန်နိုင်ငံ", r: "Spain" },
              { l: "ဆွီဒင်နိုင်ငံ", r: "Sweden" },
              { l: "နော်ဝေးနိုင်ငံ", r: "Norway" },
            ],
          },

          // ── The neighbours ──
          {
            kind: "learn",
            step: 3,
            my: "ဗီယက်နမ်နိုင်ငံ",
            en: "Vietnam",
            emoji: "🇻🇳",
          },
          {
            kind: "learn",
            step: 3,
            my: "မလေးရှားနိုင်ငံ",
            en: "Malaysia",
            emoji: "🇲🇾",
          },
          {
            kind: "learn",
            step: 3,
            my: "အိန္ဒိယနိုင်ငံ",
            en: "India",
            emoji: "🇮🇳",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဖိလစ်ပိုင်နိုင်ငံ",
            en: "The Philippines",
            emoji: "🇵🇭",
          },
          {
            kind: "learn",
            step: 3,
            my: "အင်ဒိုနီးရှားနိုင်ငံ",
            en: "Indonesia",
            emoji: "🇮🇩",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ဗီယက်နမ်နိုင်ငံ",
            options: [{ text: "Vietnam" }, { text: "Malaysia" }, { text: "India" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "အင်ဒိုနီးရှားနိုင်ငံ",
            en: "Indonesia",
            optionLang: "en",
            options: [{ text: "Indonesia" }, { text: "Vietnam" }, { text: "Malaysia" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဗီယက်နမ်နိုင်ငံ", r: "Vietnam" },
              { l: "မလေးရှားနိုင်ငံ", r: "Malaysia" },
              { l: "အိန္ဒိယနိုင်ငံ", r: "India" },
              { l: "ဖိလစ်ပိုင်နိုင်ငံ", r: "The Philippines" },
            ],
          },

          // ── Cities ──
          {
            kind: "learn",
            step: 4,
            my: "တိုကျို",
            en: "Tokyo",
            emoji: "🗼",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဘန်ကောက်",
            en: "Bangkok",
            emoji: "🛺",
          },
          {
            kind: "learn",
            step: 4,
            my: "နယူးယောက်",
            en: "New York",
            emoji: "🚕",
          },
          {
            kind: "learn",
            step: 4,
            my: "ပဲရစ်",
            en: "Paris",
            emoji: "🥐",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဗီယင်နာ",
            en: "Vienna",
            emoji: "🎻",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "တိုကျို",
            options: [{ text: "Tokyo" }, { text: "Bangkok" }, { text: "New York" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "ဗီယင်နာ",
            en: "Vienna",
            optionLang: "en",
            options: [{ text: "Vienna" }, { text: "Tokyo" }, { text: "Bangkok" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "တိုကျို", r: "Tokyo" },
              { l: "ဘန်ကောက်", r: "Bangkok" },
              { l: "နယူးယောက်", r: "New York" },
              { l: "ပဲရစ်", r: "Paris" },
            ],
          },
        ],
      },
      {
        id: "around-myanmar",
        title: "Around Myanmar",
        emoji: "🗺️",
        // Where the payoff stops being a party trick. A bus ticket, a platform
        // board and a road sign are all written in exactly these words, and none of
        // them will ever be romanized for you.
        scriptOnly: true,
        exercises: [
          // ── The cities everyone names first, and မြို့ "town" ──
          {
            kind: "learn",
            my: "ရန်ကုန်",
            en: "Yangon",
            emoji: "🏙️",
          },
          {
            kind: "learn",
            my: "မန္တလေးမြို့",
            en: "Mandalay",
            emoji: "🏯",
            note: "မြို့ on the end means \"town\", the way နိုင်ငံ meant \"country\". Signs use it far more often than maps in English do.",
          },
          {
            kind: "learn",
            my: "ပုဂံမြို့",
            en: "Bagan",
            emoji: "🛕",
          },
          {
            kind: "learn",
            my: "မော်လမြိုင်မြို့",
            en: "Mawlamyine",
            emoji: "⛵",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "ရန်ကုန်",
            options: [{ text: "Yangon" }, { text: "Mandalay" }, { text: "Bagan" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "မော်လမြိုင်မြို့",
            en: "Mawlamyine",
            optionLang: "en",
            options: [{ text: "Mawlamyine" }, { text: "Yangon" }, { text: "Mandalay" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ရန်ကုန်", r: "Yangon" },
              { l: "မန္တလေးမြို့", r: "Mandalay" },
              { l: "ပုဂံမြို့", r: "Bagan" },
              { l: "မော်လမြိုင်မြို့", r: "Mawlamyine" },
            ],
          },

          // ── Down the delta and the river ──
          {
            kind: "learn",
            step: 2,
            my: "ပဲခူးမြို့",
            en: "Bago",
            emoji: "🏛️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ပုသိမ်မြို့",
            en: "Pathein",
            emoji: "☂️",
          },
          {
            kind: "learn",
            step: 2,
            my: "စစ်ကိုင်းမြို့",
            en: "Sagaing",
            emoji: "⛩️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ထားဝယ်မြို့",
            en: "Dawei",
            emoji: "🏖️",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "ပဲခူးမြို့",
            options: [{ text: "Bago" }, { text: "Pathein" }, { text: "Sagaing" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ထားဝယ်မြို့",
            en: "Dawei",
            optionLang: "en",
            options: [{ text: "Dawei" }, { text: "Bago" }, { text: "Pathein" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ပဲခူးမြို့", r: "Bago" },
              { l: "ပုသိမ်မြို့", r: "Pathein" },
              { l: "စစ်ကိုင်းမြို့", r: "Sagaing" },
              { l: "ထားဝယ်မြို့", r: "Dawei" },
            ],
          },

          // ── The hills and the far edges ──
          {
            kind: "learn",
            step: 3,
            my: "တောင်ကြီး",
            en: "Taunggyi",
            emoji: "⛰️",
          },
          {
            kind: "learn",
            step: 3,
            my: "မြစ်ကြီးနား",
            en: "Myitkyina",
            emoji: "🏔️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကျိုင်းတုံ",
            en: "Kengtung",
            emoji: "🌄",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကော့သောင်း",
            en: "Kawthaung",
            emoji: "🏝️",
          },
          {
            kind: "learn",
            step: 3,
            my: "တာချီလိပ်",
            en: "Tachilek",
            emoji: "🛂",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "တောင်ကြီး",
            options: [{ text: "Taunggyi" }, { text: "Myitkyina" }, { text: "Kengtung" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "တာချီလိပ်",
            en: "Tachilek",
            optionLang: "en",
            options: [{ text: "Tachilek" }, { text: "Taunggyi" }, { text: "Myitkyina" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "တောင်ကြီး", r: "Taunggyi" },
              { l: "မြစ်ကြီးနား", r: "Myitkyina" },
              { l: "ကျိုင်းတုံ", r: "Kengtung" },
              { l: "ကော့သောင်း", r: "Kawthaung" },
            ],
          },

          // ── Yangon townships, which is what a taxi actually asks you for ──
          {
            kind: "learn",
            step: 4,
            my: "အင်းစိန်",
            en: "Insein",
            emoji: "🚉",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဗဟန်း",
            en: "Bahan",
            emoji: "🏘️",
          },
          {
            kind: "learn",
            step: 4,
            my: "တာမွေ",
            en: "Tamwe",
            emoji: "🏬",
          },
          {
            kind: "learn",
            step: 4,
            my: "ကမာရွတ်",
            en: "Kamayut",
            emoji: "🎓",
          },
          {
            kind: "learn",
            step: 4,
            my: "လှိုင်",
            en: "Hlaing",
            emoji: "🛣️",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "အင်းစိန်",
            options: [{ text: "Insein" }, { text: "Bahan" }, { text: "Tamwe" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "လှိုင်",
            en: "Hlaing",
            optionLang: "en",
            options: [{ text: "Hlaing" }, { text: "Insein" }, { text: "Bahan" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "အင်းစိန်", r: "Insein" },
              { l: "ဗဟန်း", r: "Bahan" },
              { l: "တာမွေ", r: "Tamwe" },
              { l: "ကမာရွတ်", r: "Kamayut" },
            ],
          },
        ],
      },
      {
        id: "streets-and-signs",
        title: "Streets and signs",
        emoji: "🪧",
        // Downtown Yangon, read off the signs themselves. လမ်း "road" is already
        // familiar from Places & Directions, so these are mostly a name plus a word
        // the learner has had since unit six — which is the point: the new thing is
        // reading at speed, not new vocabulary.
        scriptOnly: true,
        exercises: [
          // ── The four roads you will walk most ──
          {
            kind: "learn",
            my: "ဗိုလ်ချုပ်လမ်း",
            en: "Bogyoke Street",
            emoji: "🛣️",
            note: "ဗိုလ်ချုပ် is \"general\" — the road, the market and the park are all named for General Aung San, so the same three syllables keep turning up.",
          },
          {
            kind: "learn",
            my: "ကမ်းနားလမ်း",
            en: "Strand Road",
            emoji: "🚢",
          },
          {
            kind: "learn",
            my: "အနော်ရထာလမ်း",
            en: "Anawrahta Street",
            emoji: "🚦",
          },
          {
            kind: "learn",
            my: "သိမ်ဖြူလမ်း",
            en: "Theinbyu Road",
            emoji: "🚌",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "ဗိုလ်ချုပ်လမ်း",
            options: [{ text: "Bogyoke Street" }, { text: "Strand Road" }, { text: "Anawrahta Street" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "သိမ်ဖြူလမ်း",
            en: "Theinbyu Road",
            optionLang: "en",
            options: [{ text: "Theinbyu Road" }, { text: "Bogyoke Street" }, { text: "Strand Road" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "ဗိုလ်ချုပ်လမ်း", r: "Bogyoke Street" },
              { l: "ကမ်းနားလမ်း", r: "Strand Road" },
              { l: "အနော်ရထာလမ်း", r: "Anawrahta Street" },
              { l: "သိမ်ဖြူလမ်း", r: "Theinbyu Road" },
            ],
          },

          // ── Four more, and one that is an avenue ──
          {
            kind: "learn",
            step: 2,
            my: "ဦးဝိစာရလမ်း",
            en: "U Wisara Road",
            emoji: "🛺",
          },
          {
            kind: "learn",
            step: 2,
            my: "အင်းစိန်လမ်း",
            en: "Insein Road",
            emoji: "🚕",
          },
          {
            kind: "learn",
            step: 2,
            my: "မဟာဗန္ဓုလလမ်း",
            en: "Maha Bandula Street",
            emoji: "🏙️",
          },
          {
            kind: "learn",
            step: 2,
            my: "တက္ကသိုလ်ရိပ်သာလမ်း",
            en: "University Avenue",
            emoji: "🎓",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "ဦးဝိစာရလမ်း",
            options: [{ text: "U Wisara Road" }, { text: "Insein Road" }, { text: "Maha Bandula Street" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "တက္ကသိုလ်ရိပ်သာလမ်း",
            en: "University Avenue",
            optionLang: "en",
            options: [{ text: "University Avenue" }, { text: "U Wisara Road" }, { text: "Insein Road" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဦးဝိစာရလမ်း", r: "U Wisara Road" },
              { l: "အင်းစိန်လမ်း", r: "Insein Road" },
              { l: "မဟာဗန္ဓုလလမ်း", r: "Maha Bandula Street" },
              { l: "တက္ကသိုလ်ရိပ်သာလမ်း", r: "University Avenue" },
            ],
          },

          // ── Where you are actually going ──
          {
            kind: "learn",
            step: 3,
            my: "ရွှေတိဂုံ ဘုရား",
            en: "Shwedagon Pagoda",
            emoji: "🛕",
          },
          {
            kind: "learn",
            step: 3,
            my: "ခြောက်ထက်ကြီး ဘုရား",
            en: "Chauktatkyi Pagoda",
            emoji: "🧘",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဗိုလ်ချုပ်စျေး",
            en: "Bogyoke Market",
            emoji: "🛍️",
          },
          {
            kind: "learn",
            step: 3,
            my: "သိမ်ကြီးစျေး",
            en: "Theingyi Market",
            emoji: "🧺",
          },
          {
            kind: "learn",
            step: 3,
            my: "အမျိုးသားပြတိုက်",
            en: "National Museum",
            emoji: "🏛️",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ရွှေတိဂုံ ဘုရား",
            options: [{ text: "Shwedagon Pagoda" }, { text: "Chauktatkyi Pagoda" }, { text: "Bogyoke Market" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "အမျိုးသားပြတိုက်",
            en: "National Museum",
            optionLang: "en",
            options: [{ text: "National Museum" }, { text: "Shwedagon Pagoda" }, { text: "Chauktatkyi Pagoda" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ရွှေတိဂုံ ဘုရား", r: "Shwedagon Pagoda" },
              { l: "ခြောက်ထက်ကြီး ဘုရား", r: "Chauktatkyi Pagoda" },
              { l: "ဗိုလ်ချုပ်စျေး", r: "Bogyoke Market" },
              { l: "သိမ်ကြီးစျေး", r: "Theingyi Market" },
            ],
          },

          // ── Landmarks that tell you where downtown ends ──
          {
            kind: "learn",
            step: 4,
            my: "ဗိုလ်ချုပ်ပန်းခြံ",
            en: "Bogyoke Park",
            emoji: "🌳",
          },
          {
            kind: "learn",
            step: 4,
            my: "အင်းဝတံတား",
            en: "Ava Bridge",
            emoji: "🌉",
          },
          {
            kind: "learn",
            step: 4,
            my: "မင်္ဂလာတံခါး",
            en: "Mingala Gate",
            emoji: "🚪",
          },
          {
            kind: "learn",
            step: 4,
            my: "ကျောက်တံတား",
            en: "Kyauk Tada",
            emoji: "🏢",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "ဗိုလ်ချုပ်ပန်းခြံ",
            options: [{ text: "Bogyoke Park" }, { text: "Ava Bridge" }, { text: "Mingala Gate" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "ကျောက်တံတား",
            en: "Kyauk Tada",
            optionLang: "en",
            options: [{ text: "Kyauk Tada" }, { text: "Bogyoke Park" }, { text: "Ava Bridge" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "ဗိုလ်ချုပ်ပန်းခြံ", r: "Bogyoke Park" },
              { l: "အင်းဝတံတား", r: "Ava Bridge" },
              { l: "မင်္ဂလာတံခါး", r: "Mingala Gate" },
              { l: "ကျောက်တံတား", r: "Kyauk Tada" },
            ],
          },
        ],
      },
      {
        id: "burmese-names",
        title: "Names",
        emoji: "👤",
        // The last thing standing between a reader and a page of Burmese: names,
        // which no dictionary will help with. Burmese ones are built from short
        // elements that each mean something, so a name is readable the way a
        // compound is — and the English names in part 4 close the unit the way it
        // opened, with a word that says itself out loud.
        scriptOnly: true,
        exercises: [
          // ── Name elements, each an ordinary word ──
          {
            kind: "learn",
            my: "စန်း",
            en: "Moon",
            emoji: "🌙",
            note: "Burmese names are assembled from pieces like this one rather than drawn from a fixed list, so a name usually reads as a small phrase of good qualities.",
          },
          {
            kind: "learn",
            my: "ခင်",
            en: "Friendly",
            emoji: "🤝",
          },
          {
            kind: "learn",
            my: "ထူး",
            en: "Outstanding",
            emoji: "⭐",
          },
          {
            kind: "learn",
            my: "နိုင်",
            en: "Overcome",
            emoji: "🏅",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "စန်း",
            options: [{ text: "Moon" }, { text: "Friendly" }, { text: "Outstanding" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "နိုင်",
            en: "Overcome",
            optionLang: "en",
            options: [{ text: "Overcome" }, { text: "Moon" }, { text: "Friendly" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "စန်း", r: "Moon" },
              { l: "ခင်", r: "Friendly" },
              { l: "ထူး", r: "Outstanding" },
              { l: "နိုင်", r: "Overcome" },
            ],
          },

          // ── Four more pieces ──
          {
            kind: "learn",
            step: 2,
            my: "စိုး",
            en: "Rule",
            emoji: "👑",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆု",
            en: "Prize",
            emoji: "🏆",
          },
          {
            kind: "learn",
            step: 2,
            my: "စင်",
            en: "Pure",
            emoji: "💧",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဆန်း",
            en: "Wondrous",
            emoji: "✨",
          },
          {
            kind: "learn",
            step: 2,
            my: "နု",
            en: "Tender",
            emoji: "🌱",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "စိုး",
            options: [{ text: "Rule" }, { text: "Prize" }, { text: "Pure" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "နု",
            en: "Tender",
            optionLang: "en",
            options: [{ text: "Tender" }, { text: "Rule" }, { text: "Prize" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "စိုး", r: "Rule" },
              { l: "ဆု", r: "Prize" },
              { l: "စင်", r: "Pure" },
              { l: "ဆန်း", r: "Wondrous" },
            ],
          },

          // ── Names you will meet in print ──
          {
            kind: "learn",
            step: 3,
            my: "ဦးအောင်ဆန်း",
            en: "Aung San",
            emoji: "🇲🇲",
            note: "ဦး in front is the respectful title for an older man, roughly \"Mr\" — it is not part of the name, which is why the road and market drop it.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဦးနေဝင်း",
            en: "Ne Win",
            emoji: "📜",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဦးသန့်",
            en: "U Thant",
            emoji: "🕊️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ကို",
            en: "Ko, before a young man’s name",
            emoji: "🧑",
          },
          {
            kind: "learn",
            step: 3,
            my: "မောင်",
            en: "Maung, for a boy",
            emoji: "👦",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ဦးအောင်ဆန်း",
            options: [{ text: "Aung San" }, { text: "Ne Win" }, { text: "U Thant" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "မောင်",
            en: "Maung, for a boy",
            optionLang: "en",
            options: [{ text: "Maung, for a boy" }, { text: "Aung San" }, { text: "Ne Win" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဦးအောင်ဆန်း", r: "Aung San" },
              { l: "ဦးနေဝင်း", r: "Ne Win" },
              { l: "ဦးသန့်", r: "U Thant" },
              { l: "ကို", r: "Ko, before a young man’s name" },
            ],
          },

          // ── English names, spelled the Burmese way ──
          {
            kind: "learn",
            step: 4,
            my: "အယ်မလီ",
            en: "Emily",
            emoji: "🙋",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဂျက်",
            en: "Jack",
            emoji: "🧢",
          },
          {
            kind: "learn",
            step: 4,
            my: "ရောဘတ်",
            en: "Robert",
            emoji: "🎩",
          },
          {
            kind: "learn",
            step: 4,
            my: "ကက်သီ",
            en: "Kathy",
            emoji: "💐",
          },
          {
            kind: "learn",
            step: 4,
            my: "လူစီ",
            en: "Lucy",
            emoji: "🌷",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "အယ်မလီ",
            options: [{ text: "Emily" }, { text: "Jack" }, { text: "Robert" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "လူစီ",
            en: "Lucy",
            optionLang: "en",
            options: [{ text: "Lucy" }, { text: "Emily" }, { text: "Jack" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "အယ်မလီ", r: "Emily" },
              { l: "ဂျက်", r: "Jack" },
              { l: "ရောဘတ်", r: "Robert" },
              { l: "ကက်သီ", r: "Kathy" },
            ],
          },
        ],
      },
      {
        id: "built-from-parts",
        title: "Words built from words",
        emoji: "🧩",
        // Nothing here is a new word. Every one is two or three words the course has
        // already taught, stuck together — ဘုန်းကြီး "monk" plus ကျောင်း "school" is
        // a monastery, and စားသောက်ဆိုင် is literally eat-drink-shop (the gloss is
        // the deck author's own). Seeing that is the difference between a vocabulary
        // that grows by memorizing and one that grows by multiplying.
        //
        // These are also exactly the words that cannot be safely romanized. A
        // compound voices at its seam — ကြီး is already "gyi:" inside ဘုန်းကြီး, and
        // ဆိုင် softens the same way after လက်ဖက်ရည် — so a romanization built by
        // gluing the parts' own romanizations together would be wrong in precisely
        // the places this lesson is about. The recording is the authority instead,
        // and the breakdown under each word carries the meaning.
        scriptOnly: true,
        exercises: [
          // ── Places to eat, made of eating and shops ──
          {
            kind: "learn",
            my: "လက်ဖက်ရည်ဆိုင်",
            en: "Tea shop",
            emoji: "🍵",
            note: "လက်ဖက်ရည် \"tea\" + ဆိုင် \"shop\". Note the ဆိုင် softens at the seam — this is why the pieces are worth knowing by sound, not by spelling out a romanization.",
          },
          {
            kind: "learn",
            my: "စားသောက်ဆိုင်",
            en: "Restaurant",
            emoji: "🍽️",
            note: "Eat-drink-shop: စား + သောက် + ဆိုင်, three words you already have.",
          },
          {
            kind: "learn",
            my: "အရက်ဆိုင်",
            en: "Liquor shop",
            emoji: "🍶",
          },
          {
            kind: "learn",
            my: "ဆိုင်ရှင်",
            en: "Shopkeeper",
            emoji: "🧑‍💼",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "လက်ဖက်ရည်ဆိုင်",
            options: [{ text: "Tea shop" }, { text: "Restaurant" }, { text: "Liquor shop" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဆိုင်ရှင်",
            en: "Shopkeeper",
            optionLang: "en",
            options: [{ text: "Shopkeeper" }, { text: "Tea shop" }, { text: "Restaurant" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "လက်ဖက်ရည်ဆိုင်", r: "Tea shop" },
              { l: "စားသောက်ဆိုင်", r: "Restaurant" },
              { l: "အရက်ဆိုင်", r: "Liquor shop" },
              { l: "ဆိုင်ရှင်", r: "Shopkeeper" },
            ],
          },

          // ── မုန့် "snack" turns other words into food ──
          {
            kind: "learn",
            step: 2,
            my: "ကိတ်မုန့်",
            en: "Cake",
            emoji: "🍰",
            note: "မုန့် on the end marks it as something you eat, so a borrowed word like ကိတ် arrives already labelled.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ပေါင်မုန့်",
            en: "Bread",
            emoji: "🍞",
          },
          {
            kind: "learn",
            step: 2,
            my: "ရေခဲမုန့်",
            en: "Ice cream",
            emoji: "🍦",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "ကိတ်မုန့်",
            options: [{ text: "Cake" }, { text: "Bread" }, { text: "Ice cream" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ရေခဲမုန့်",
            en: "Ice cream",
            optionLang: "en",
            options: [{ text: "Ice cream" }, { text: "Cake" }, { text: "Bread" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ကိတ်မုန့်", r: "Cake" },
              { l: "ပေါင်မုန့်", r: "Bread" },
              { l: "ရေခဲမုန့်", r: "Ice cream" },
            ],
          },

          // ── Buildings, roads and ranks ──
          {
            kind: "learn",
            step: 3,
            my: "ဘုန်းကြီးကျောင်း",
            en: "Monastery",
            emoji: "🛕",
            note: "ဘုန်းကြီး \"monk\" + ကျောင်း \"school\" — a monastery is where monks are taught, and the word says so.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဘုရားလမ်း",
            en: "Pagoda Road",
            emoji: "🛣️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဗိုလ်ကြီး",
            en: "Captain",
            emoji: "🎖️",
            note: "ဗိုလ် \"officer\" + ကြီး \"big\". Ranks work the same way sizes do.",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ဘုန်းကြီးကျောင်း",
            options: [{ text: "Monastery" }, { text: "Pagoda Road" }, { text: "Captain" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "ဗိုလ်ကြီး",
            en: "Captain",
            optionLang: "en",
            options: [{ text: "Captain" }, { text: "Monastery" }, { text: "Pagoda Road" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဘုန်းကြီးကျောင်း", r: "Monastery" },
              { l: "ဘုရားလမ်း", r: "Pagoda Road" },
              { l: "ဗိုလ်ကြီး", r: "Captain" },
            ],
          },

          // ── သည် on the end: the person who deals in it ──
          {
            kind: "learn",
            step: 4,
            my: "မုန့်သည်",
            en: "Snack seller",
            emoji: "🧁",
            note: "သည် makes \"the one who deals in it\" out of the thing itself. Once you have it, a whole class of jobs reads without being taught.",
          },
          {
            kind: "learn",
            step: 4,
            my: "ရေသည်",
            en: "Water seller",
            emoji: "🚰",
          },
          {
            kind: "learn",
            step: 4,
            my: "ကုန်သည်",
            en: "Trader",
            emoji: "⚖️",
          },
          {
            kind: "learn",
            step: 4,
            my: "ငါးကျပ်",
            en: "Five kyat",
            emoji: "💰",
          },
          {
            kind: "learn",
            step: 4,
            my: "ငါးနာရီ",
            en: "Five o'clock",
            emoji: "🕔",
          },
          {
            kind: "choice",
            step: 4,
            question: "What does this say?",
            promptMy: "မုန့်သည်",
            options: [{ text: "Snack seller" }, { text: "Water seller" }, { text: "Trader" }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 4,
            my: "ငါးနာရီ",
            en: "Five o'clock",
            optionLang: "en",
            options: [{ text: "Five o'clock" }, { text: "Snack seller" }, { text: "Water seller" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "မုန့်သည်", r: "Snack seller" },
              { l: "ရေသည်", r: "Water seller" },
              { l: "ကုန်သည်", r: "Trader" },
              { l: "ငါးကျပ်", r: "Five kyat" },
            ],
          },
        ],
      },
      {
        id: "saying-what-you-want",
        title: "Saying what you want",
        emoji: "🙋",
        // One pattern, four ways round. ချင် after a verb means "want to", and the
        // course has already used it twice without naming it (စားချင်တယ် "I want to
        // eat", သောက်ချင်တယ် "I want to drink"). Naming it turns those two words into
        // a frame: any verb you know goes in front, and the ending decides whether
        // you are stating, asking, or refusing.
        //
        // The most useful thing in the unit, which is why it sits opposite an
        // optional loanwords lesson rather than beside more proper nouns.
        scriptOnly: true,
        exercises: [
          // ── Stating it: …ချင်ပါတယ် ──
          {
            kind: "learn",
            my: "သွားချင်ပါတယ်",
            en: "I want to go.",
            emoji: "🚶",
            note: "The frame is verb + ချင် + ပါတယ်. Swap the verb and you have the sentence for anything you can already name.",
          },
          {
            kind: "learn",
            my: "ထိုင်ချင်ပါတယ်။",
            en: "I'd like to sit down.",
            emoji: "🪑",
          },
          {
            kind: "learn",
            my: "ဆိုင် ဝင်ချင်ပါတယ်။",
            en: "I'd like to go into the shop.",
            emoji: "🏪",
          },
          {
            kind: "learn",
            my: "စမူဆာ စားချင်ပါတယ်။",
            en: "I want to eat a samosa.",
            emoji: "🥟",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "သွားချင်ပါတယ်",
            options: [{ text: "I want to go." }, { text: "I'd like to sit down." }, { text: "I'd like to go into the shop." }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "စမူဆာ စားချင်ပါတယ်။",
            en: "I want to eat a samosa.",
            optionLang: "en",
            options: [{ text: "I want to eat a samosa." }, { text: "I want to go." }, { text: "I'd like to sit down." }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "သွားချင်ပါတယ်", r: "I want to go." },
              { l: "ထိုင်ချင်ပါတယ်။", r: "I'd like to sit down." },
              { l: "ဆိုင် ဝင်ချင်ပါတယ်။", r: "I'd like to go into the shop." },
              { l: "စမူဆာ စားချင်ပါတယ်။", r: "I want to eat a samosa." },
            ],
          },

          // ── Asking what: ဘာ … ချင်သလဲ ──
          {
            kind: "learn",
            step: 2,
            my: "ဘာ စားချင်သလဲ",
            en: "What do you want to eat?",
            emoji: "🍜",
            note: "ဘာ \"what\" in front, သလဲ on the end — the same ending as ဘယ်သွားမလဲ from Real Talk.",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာ သင်ချင်သလဲ။",
            en: "What do you want to learn?",
            emoji: "📚",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာ မေးချင်သလဲ။",
            en: "What do you want to ask?",
            emoji: "🙋‍♂️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဘာ ရေးချင်သလဲ။",
            en: "What do you want to write?",
            emoji: "✍️",
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "ဘာ စားချင်သလဲ", r: "What do you want to eat?" },
              { l: "ဘာ သင်ချင်သလဲ။", r: "What do you want to learn?" },
              { l: "ဘာ မေးချင်သလဲ။", r: "What do you want to ask?" },
              { l: "ဘာ ရေးချင်သလဲ။", r: "What do you want to write?" },
            ],
          },

          // ── Asking yes or no: …ချင်သလား ──
          {
            kind: "learn",
            step: 3,
            my: "ပလာတာ စားချင်သလား။",
            en: "Do you want to eat a parata?",
            emoji: "🫓",
            note: "သလား instead of သလဲ turns the same frame into a yes/no question.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဝင်ထိုင်ချင်သလား။",
            en: "Do you want to come in and sit down?",
            emoji: "🚪",
          },
          {
            kind: "learn",
            step: 3,
            my: "ချောကလက် ကိုင်ချင်သလား။",
            en: "Do you want to hold the chocolate?",
            emoji: "🍫",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဝက်သား ရှောင်ချင်သလား။",
            en: "Do you want to avoid pork?",
            emoji: "🚫",
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ပလာတာ စားချင်သလား။", r: "Do you want to eat a parata?" },
              { l: "ဝင်ထိုင်ချင်သလား။", r: "Do you want to come in and sit down?" },
              { l: "ချောကလက် ကိုင်ချင်သလား။", r: "Do you want to hold the chocolate?" },
              { l: "ဝက်သား ရှောင်ချင်သလား။", r: "Do you want to avoid pork?" },
            ],
          },

          // ── Turning it down: မ…ချင်ပါဘူး ──
          {
            kind: "learn",
            step: 4,
            my: "ပလာတာ မစားချင်ပါဘူး။",
            en: "I don't want to eat a parata.",
            emoji: "🙅",
            note: "The negative wraps the verb: မ in front, ဘူး at the back, exactly as in မကြိုက်ဘူး and မလိုဘူး.",
          },
          {
            kind: "learn",
            step: 4,
            my: "ထမင်း မစားချင်ပါဘူး။",
            en: "We don't want to eat rice.",
            emoji: "🍚",
          },
          {
            kind: "learn",
            step: 4,
            my: "တက်စီ မစီးချင်ပါဘူး။",
            en: "I don't want to take the taxi.",
            emoji: "🚕",
          },
          {
            kind: "learn",
            step: 4,
            my: "ကား မဆေးချင်ပါဘူး။",
            en: "She doesn't want to wash the car.",
            emoji: "🚗",
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "ပလာတာ မစားချင်ပါဘူး။", r: "I don't want to eat a parata." },
              { l: "ထမင်း မစားချင်ပါဘူး။", r: "We don't want to eat rice." },
              { l: "တက်စီ မစီးချင်ပါဘူး။", r: "I don't want to take the taxi." },
              { l: "ကား မဆေးချင်ပါဘူး။", r: "She doesn't want to wash the car." },
            ],
          },
        ],
      },
      {
        id: "asking-your-way",
        title: "Asking your way",
        emoji: "🧭",
        // Where the unit pays out. The street and city names came from this unit's
        // own lessons, the question words (ဘယ်မှာလဲ, ဒီမှာ, ရှိတယ်) came from Places
        // & Directions, and neither half was much use without the other. Part 4
        // answers a question the course has already taught you to ask: reading solo
        // teaches ဘယ်နိုင်ငံက လာသလဲ။ "what country does she come from?", and these
        // are the replies.
        scriptOnly: true,
        exercises: [
          // ── Asking where something is ──
          {
            kind: "learn",
            my: "အနော်ရထာလမ်း ဘယ်မှာလဲ။",
            en: "Where is Anawrahta Street?",
            emoji: "🧭",
            note: "A street name from this unit in front of ဘယ်မှာလဲ from Places & Directions. Both halves were already yours.",
          },
          {
            kind: "learn",
            my: "မင်္ဂလာစျေး ဘယ်မှာလဲ။",
            en: "Where's Mingala Market?",
            emoji: "🛍️",
          },
          {
            kind: "learn",
            my: "ကမ်းနားလမ်းက ဒီမှာလား။",
            en: "Is Strand Road here?",
            emoji: "🚢",
          },
          {
            kind: "learn",
            my: "ဆရာစံလမ်းက ဒီမှာလား။",
            en: "Is Saya San Street here?",
            emoji: "🚦",
          },
          {
            kind: "choice",
            question: "What does this say?",
            promptMy: "အနော်ရထာလမ်း ဘယ်မှာလဲ။",
            options: [{ text: "Where is Anawrahta Street?" }, { text: "Where's Mingala Market?" }, { text: "Is Strand Road here?" }],
            correct: 0,
          },
          {
            kind: "listen",
            my: "ဆရာစံလမ်းက ဒီမှာလား။",
            en: "Is Saya San Street here?",
            optionLang: "en",
            options: [{ text: "Is Saya San Street here?" }, { text: "Where is Anawrahta Street?" }, { text: "Where's Mingala Market?" }],
            correct: 0,
          },
          {
            kind: "match",
            pairs: [
              { l: "အနော်ရထာလမ်း ဘယ်မှာလဲ။", r: "Where is Anawrahta Street?" },
              { l: "မင်္ဂလာစျေး ဘယ်မှာလဲ။", r: "Where's Mingala Market?" },
              { l: "ကမ်းနားလမ်းက ဒီမှာလား။", r: "Is Strand Road here?" },
              { l: "ဆရာစံလမ်းက ဒီမှာလား။", r: "Is Saya San Street here?" },
            ],
          },

          // ── Being told the answer ──
          {
            kind: "learn",
            step: 2,
            my: "စထရင်းဟိုတယ်က ဒီမှာပါ။",
            en: "The Strand Hotel is here.",
            emoji: "🏨",
            note: "ဒီမှာပါ is the answer to ဒီမှာလား — the polite ပါ where the question had လား.",
          },
          {
            kind: "learn",
            step: 2,
            my: "မောင်တင်စျေးက ဒီမှာပါ။",
            en: "Mawtin Market is here.",
            emoji: "🧺",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဒါက ဟိုတယ်ပါ။",
            en: "That's a hotel.",
            emoji: "🛎️",
          },
          {
            kind: "learn",
            step: 2,
            my: "ဒီလမ်းက အေလမ်းပါ။",
            en: "This road is A Road.",
            emoji: "🛣️",
          },
          {
            kind: "choice",
            step: 2,
            question: "What does this say?",
            promptMy: "စထရင်းဟိုတယ်က ဒီမှာပါ။",
            options: [{ text: "The Strand Hotel is here." }, { text: "Mawtin Market is here." }, { text: "That's a hotel." }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 2,
            my: "ဒီလမ်းက အေလမ်းပါ။",
            en: "This road is A Road.",
            optionLang: "en",
            options: [{ text: "This road is A Road." }, { text: "The Strand Hotel is here." }, { text: "Mawtin Market is here." }],
            correct: 0,
          },
          {
            kind: "match",
            step: 2,
            pairs: [
              { l: "စထရင်းဟိုတယ်က ဒီမှာပါ။", r: "The Strand Hotel is here." },
              { l: "မောင်တင်စျေးက ဒီမှာပါ။", r: "Mawtin Market is here." },
              { l: "ဒါက ဟိုတယ်ပါ။", r: "That's a hotel." },
              { l: "ဒီလမ်းက အေလမ်းပါ။", r: "This road is A Road." },
            ],
          },

          // ── Is there one near here? ──
          {
            kind: "learn",
            step: 3,
            my: "ဒီနားမှာ ဟိုတယ် ရှိသလား။",
            en: "Is there a hotel near here?",
            emoji: "🏩",
            note: "အနား \"nearby\" and ရှိတယ် \"there is\" both come from Places & Directions; only the word order is new.",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဒီမှာ တယ်လီဖုန်း ရှိပါတယ်။",
            en: "There is a telephone here.",
            emoji: "☎️",
          },
          {
            kind: "learn",
            step: 3,
            my: "ဒီဆိုင်မှာ ဘာ ရှိသလဲ။",
            en: "What is there in this shop?",
            emoji: "🏬",
          },
          {
            kind: "learn",
            step: 3,
            my: "ပိုက်ဆံ မရှိပါဘူး။",
            en: "They don't have any money.",
            emoji: "💸",
          },
          {
            kind: "choice",
            step: 3,
            question: "What does this say?",
            promptMy: "ဒီနားမှာ ဟိုတယ် ရှိသလား။",
            options: [{ text: "Is there a hotel near here?" }, { text: "What is there in this shop?" }, { text: "They don't have any money." }],
            correct: 0,
          },
          {
            kind: "listen",
            step: 3,
            my: "ပိုက်ဆံ မရှိပါဘူး။",
            en: "They don't have any money.",
            optionLang: "en",
            options: [{ text: "They don't have any money." }, { text: "Is there a hotel near here?" }, { text: "What is there in this shop?" }],
            correct: 0,
          },
          {
            kind: "match",
            step: 3,
            pairs: [
              { l: "ဒီနားမှာ ဟိုတယ် ရှိသလား။", r: "Is there a hotel near here?" },
              { l: "ဒီမှာ တယ်လီဖုန်း ရှိပါတယ်။", r: "There is a telephone here." },
              { l: "ဒီဆိုင်မှာ ဘာ ရှိသလဲ။", r: "What is there in this shop?" },
              { l: "ပိုက်ဆံ မရှိပါဘူး။", r: "They don't have any money." },
            ],
          },

          // ── Where someone comes from ──
          {
            kind: "learn",
            step: 4,
            my: "ဂျပန်က လာပါတယ်။",
            en: "They come from Japan.",
            emoji: "🇯🇵",
            note: "The country from On the map, then က \"from\" and လာ \"come\". This is the reply to ဘယ်နိုင်ငံက လာသလဲ။ in Reading solo.",
          },
          {
            kind: "learn",
            step: 4,
            my: "ဂျာမနီက လာပါတယ်။",
            en: "They come from Germany.",
            emoji: "🇩🇪",
          },
          {
            kind: "learn",
            step: 4,
            my: "အင်းစိန်က လာပါတယ်။",
            en: "They come from Insein.",
            emoji: "🚉",
          },
          {
            kind: "learn",
            step: 4,
            my: "နီပေါက လာပါတယ်။",
            en: "They come from Nepal.",
            emoji: "🏔️",
          },
          {
            kind: "match",
            step: 4,
            pairs: [
              { l: "ဂျပန်က လာပါတယ်။", r: "They come from Japan." },
              { l: "ဂျာမနီက လာပါတယ်။", r: "They come from Germany." },
              { l: "အင်းစိန်က လာပါတယ်။", r: "They come from Insein." },
              { l: "နီပေါက လာပါတယ်။", r: "They come from Nepal." },
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
