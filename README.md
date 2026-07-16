# MyanLingo 🐱

A Duolingo-style prototype for learning **Myanmar language (Burmese)**, built with SvelteKit.
Meet **Shwe** (ရွှေ, "gold") — a golden Burmese cat who guides you through a beginner course.

## Features

- **Beginner course** — 4 units × 3 lessons (~85 exercises): Greetings, Numbers, The Script, Food & Drink. Real Burmese script with beginner-friendly romanization and cultural notes.
- **4 exercise types** — new-word cards, multiple choice, tap-the-pairs matching, and sentence building from syllable tiles. Wrong answers are re-queued at the end of the lesson, Duolingo-style.
- **Progress in localStorage** — XP, day streak, per-lesson star ratings (1–3 based on mistakes), and sequential lesson unlocking. No accounts, no backend.
- **Audio** — every word/phrase has a pre-generated pronunciation MP3 (Microsoft Edge neural TTS, voice `my-MM-NilarNeural`) in `static/audio/`, with platform speech synthesis as a fallback. New words auto-play. Plus Web Audio-synthesized feedback sounds (correct chime, wrong buzz, match pop, completion fanfare). Toggleable from the header.
- **Romanization toggle** — off by default (audio carries pronunciation); flip it on with the `Aa` button in the header or during a lesson.
- **Animations** — springy `linear()` easings, animated mascot moods (idle/happy/sad/celebrate), confetti on lesson completion, and reduced-motion support.
- **Script Studio** (optional track) — learn to *read* Burmese, built around how script learning actually works rather than the lesson-path model:
  - a living **alphabet chart** (51 glyphs in traditional rows) with per-glyph mastery heat; tap any glyph for its name, mnemonic, audio and lookalikes
  - 10 **micro-intro units** ordered by letter frequency, with tracing (canvas), mnemonics from the traditional letter names, and confusable warnings
  - a **spaced-repetition Practice** session (Leitner boxes in localStorage) whose exercise type escalates with mastery: glyph→sound, sound→glyph with lookalike distractors, syllable reading, and timed speed rounds
  - an interactive **syllable builder** — snap vowel signs around a base consonant and hear the composed syllable; includes a challenge mode
  - **decodable words**: real Burmese words readable using only components you've learned
- **Immersion mode** (off by default) — UI buttons and labels switch to Burmese in three tiers as your script knowledge grows, like gradually setting your phone to the target language.
- **Profile page** (`/account`) — stats, settings and reset options; still 100% localStorage.

## Running

```sh
bun install
bun run dev
```

Then open the printed URL (defaults to http://localhost:5173).

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
- `src/lib/components/` — mascot, exercise components, tracing canvas, confetti
- `src/routes/+page.svelte` — home / skill path
- `src/routes/lesson/[id]/+page.svelte` — course lesson player
- `src/routes/script/` — Script Studio (chart, intro units, practice, syllable builder)
- `src/routes/account/+page.svelte` — profile: stats, settings, resets

To add content, edit `course.ts` — lesson unlocking, the path UI, and the player pick it up automatically.
