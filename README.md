# MyanLingo 🐱

A Duolingo-style prototype for learning **Myanmar language (Burmese)**, built with SvelteKit.
Meet **Shwe** (ရွှေ, "gold") — a golden Burmese cat who guides you through a beginner course.

## Features

- **Beginner course** — 7 units × 3 lessons (~180 exercises): Greetings, Numbers, The Script, Food & Drink, Family, Places & Directions, Time & Days. Real Burmese script with beginner-friendly romanization and cultural notes.
- **5 exercise types** — new-word cards, multiple choice, tap-the-pairs matching, sentence building from syllable tiles, and listening comprehension ("tap what you hear" from audio alone, with the English meaning revealed after answering). Choice and listening answers check on a single tap — no Confirm step. Wrong answers show a prominent correct-answer card (script + meaning + replay button), auto-play its pronunciation, and re-queue at the end of the lesson, Duolingo-style.
- **Progress in localStorage** — XP, day streak, per-lesson star ratings (1–3 based on mistakes), and sequential lesson unlocking. No accounts, no backend.
- **Audio** — every word/phrase has a pre-generated pronunciation MP3 (Microsoft Edge neural TTS, voice `my-MM-NilarNeural`) in `static/audio/`, with platform speech synthesis as a fallback. New words auto-play. Plus Web Audio-synthesized feedback sounds (correct chime, wrong buzz, match pop, completion fanfare). Toggleable from the header.
- **Romanization toggle** — off by default (audio carries pronunciation); flip it on with the `Aa` button in the header or during a lesson.
- **Keyboard shortcuts** — 1–9 taps options, tiles and match cards; Enter checks/continues; Backspace removes the last assembled tile. Badges appear on devices with a keyboard.
- **Animations** — springy `linear()` easings, animated mascot moods (idle/happy/sad/celebrate), confetti on lesson completion, and reduced-motion support.
- **Script Studio** (optional track) — learn to *read* Burmese, built around how script learning actually works rather than the lesson-path model:
  - a living **alphabet chart** (51 glyphs in traditional rows) with per-glyph mastery heat; tap any glyph for its name, mnemonic, audio and lookalikes
  - 11 **micro-intro units** ordered by letter frequency, with mnemonics from the traditional letter names and confusable warnings — capped by a **stacked consonants** (ပါဌ်ဆင့်) unit: concept cards plus real Pali-loan reading (ကမ္ဘာ, မန္တလေး, သစ္စာ…)
  - a **spaced-repetition Practice** session (Leitner boxes in localStorage) whose exercise type escalates with mastery: glyph→sound, sound→glyph with lookalike distractors, syllable reading, and timed speed rounds
  - **minimal-pair listening drills** — hear a syllable, tap the written syllable you heard: aspiration contrasts (က/ခ, စ/ဆ, တ/ထ, ပ/ဖ) and low-vs-high tone (ာ vs ား)
  - an interactive **syllable builder** — snap vowel signs around a base consonant and hear the composed syllable; includes a challenge mode
  - **decodable words & sentences**: real Burmese words — and short real sentences in later units — readable using only components you've learned
- **Practice & mistake review with a recall ladder** — completed lessons feed their vocabulary into a Leitner-box spaced-repetition queue (localStorage); the home-screen Practice card shows what's due, and sessions drill recent mistakes first. The SRS box drives the exercise *format*, not just the schedule: new words get recognition (choice/listening), maturing words get production (build the word from script tiles), and mastered words get free recall (see the meaning, produce the Burmese, self-grade) — because producing an answer strengthens memory more than recognizing one.
- **Grammar tips at the point of error** — miss an answer and the reveal card adds a one-line explanation of the pattern you missed (question particle လား, negation မ…ဘူး, polite ပါ, future မယ်…). No grammar chapters; one sentence, exactly when it's relevant.
- **Decodable stories** (`/stories`) — tiny chat-bubble dialogues made of words you've already learned, unlocked as you complete the lessons they draw from. Lines play one at a time with audio, every word is tap-to-gloss (new words get a 🆕 dot), and a single comprehension question closes each story.
- **Daily goal, activity heatmap & achievements** — settable XP goal with a progress ring on home, a 12-week activity calendar and a badge collection on the profile page. A home-screen nudge banner tracks today's XP and suggests the single best next action (due reviews → next lesson → crown run), switching to a "goal reached — how about…?" prompt once the goal is hit.
- **Reader track** (`/reader`) — a third track for people who know the script but not the language: read the whole course unit-by-unit in Burmese script only (options never show romanization), rotating hear→script, script→meaning and meaning→script drills.
- **Quick-access script table** — a က button on the home, lesson, practice and reader headers opens a reference overlay of the full alphabet (with sounds and your SRS mastery heat); tap any letter to hear its name.
- **Loanword Lab** (Script Studio) — decode familiar borrowed words (ကော်ဖီ coffee, ဟိုတယ် hotel, ကွန်ပျူတာ computer…) from script alone: first a decode pass where the audio is held back until you answer, then a hear-it→find-it-written pass. No romanization anywhere; Script Studio sound→glyph drills are likewise audio-first (you hear the letter's name).
- **Crowns, combos & streak freezes** — completed lessons offer a 👑 hard mode (drills only; a perfect run earns the crown); consecutive correct answers build a combo with bonus XP at ×5; streak freezes (bought with XP on the profile page) silently cover missed days.
- **Immersion mode** (off by default) — UI buttons and labels switch to Burmese in three tiers as your script knowledge grows, like gradually setting your phone to the target language.
- **Install as an app / offline** — a web manifest + service worker precache the app shell and cache audio as it plays, so the app works offline after the first visit and can be added to a phone home screen.
- **Profile page** (`/account`) — stats, settings and reset options; still 100% localStorage.
- **Dark mode** — warm charcoal/plum dark theme with gold kept as the hero accent. Follows the OS by default; force light/dark from the profile page (System / Light / Dark). Applied pre-paint, so no flash of the wrong theme.

## Running

```sh
bun install
bun run dev
```

Then open the printed URL (defaults to http://localhost:5173).

## Testing

Unit tests (Vitest) cover the syllable composer, both spaced-repetition stores and the practice-queue builders:

```sh
bun run test
```

End-to-end smoke tests use [Playwright](https://playwright.dev) (Chromium only). One-time setup:

```sh
bunx playwright install chromium
```

Then run the suite (it starts its own dev server on port 4173):

```sh
bun run test:e2e
```

The tests live in `e2e/smoke.spec.ts` and are driven by the course data in `src/lib/data/course.ts`, so they answer every exercise correctly and keep passing when lesson content changes.

## Regenerating pronunciation audio

After changing course content:

```sh
pip install edge-tts   # once
bun run audio
```

This writes MP3s for any new Burmese strings to `static/audio/` and refreshes `src/lib/audio-manifest.json`. Set `TTS_VOICE=my-MM-ThihaNeural` for the male voice, or `EDGE_TTS=/path/to/edge-tts` if the binary isn't on PATH.

## Linting content

After editing `course.ts` or `script.ts`:

```sh
bun run lint:content
```

This validates the course (choice answers in range, unique options, match pairs, assemble tiles composing the target sentence, unique ids), the script data (confusable/unit references, decodable words using only already-taught glyphs and recomposing their Burmese text), and audio coverage. Missing audio is reported as a warning — regenerate with `bun run audio` — and only fails the run with `--strict-audio`; structural errors always exit 1.

## Structure

- `src/lib/data/course.ts` — all course content (units → lessons → exercises)
- `src/lib/data/script.ts` — the script: glyphs, mnemonics, teaching units, syllable composition, decodable words
- `src/lib/progress.svelte.ts` — runes-based progress store persisted to localStorage
- `src/lib/srs.svelte.ts` — Leitner-box spaced repetition for the Script Studio
- `src/lib/script-session.ts` — drill queue generation (confusable-aware distractors)
- `src/lib/i18n.svelte.ts` — immersion-mode UI strings (English → Burmese by tier)
- `src/lib/audio.ts` — Web Audio SFX + pronunciation playback
- `src/lib/components/` — mascot, exercise components, confetti (plus the disabled tracing canvas, see IDEAS.md #6/#10)
- `src/routes/+page.svelte` — home / skill path
- `src/routes/lesson/[id]/+page.svelte` — course lesson player
- `src/routes/script/` — Script Studio (chart, intro units, practice, syllable builder)
- `src/routes/account/+page.svelte` — profile: stats, settings, resets

To add content, edit `course.ts` — lesson unlocking, the path UI, and the player pick it up automatically.
