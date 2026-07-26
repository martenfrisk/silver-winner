# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (`bun.lock`, `.npmrc` sets `engine-strict`).

```sh
bun run dev            # vite dev, port 5173 (honors $PORT)
bun run check          # svelte-check + tsc — the type gate
bun run test           # vitest, unit tests only (src/**/*.test.ts)
bun run test:e2e       # playwright, chromium; starts its own dev server on 4173
bun run lint:content   # validates course/script data + audio coverage
bun run audio          # regenerates pronunciation MP3s (needs edge-tts)
```

Single unit test file / single test:

```bash
bun run test src/lib/srs.test.ts -t "promotes on a correct answer"
```

Single e2e test (one-time: `bunx playwright install chromium`):

```bash
bunx playwright test -g "completes the first lesson"
```

## Architecture

SvelteKit 2 + **Svelte 5 runes** (forced on for all non-`node_modules` files in `vite.config.ts`), `adapter-vercel`. **No backend, no accounts** — every byte of learner state is localStorage. Anything that looks like it needs a server doesn't; keep it client-side.

### Content is data, and the data is the source of truth

`src/lib/data/course.ts` (units → lessons → exercises), `script.ts` (glyphs, teaching units, syllable composition, decodable words) and `stories.ts` are consumed by everything downstream: the lesson player and path UI, lesson unlocking, the vocab SRS index, the audio generator, the content linter, *and* the e2e tests (which read the course to answer exercises correctly). Adding content means editing these files only — nothing else needs registering.

The one derived file is `src/lib/data/lesson-order.ts` (the flat unlock order), **generated** by `bun run lint:content` and never hand-edited. It exists so `progress.svelte.ts` — which the root layout pulls onto every page — doesn't drag all of `course.ts` along with it. `lesson-order.test.ts` fails if it drifts from the course.

After editing `course.ts` / `script.ts` / `stories.ts`:

```bash
bun run lint:content && bun run audio
```

Both scripts collect speakable strings from `scripts/speakables.ts`. Add a new exercise kind or speakable field there and both stay in step. (`bun run audio` regenerates only what's missing from disk, so it's cheap to re-run; `--voice m` limits it to one voice.)

### Audio pipeline

Every Burmese string is pre-rendered to `static/audio/<djb2-hash>.mp3` by Edge neural TTS, **in each voice in `src/lib/voices.ts`** (`f` = `my-MM-NilarNeural`, `m` = `my-MM-ThihaNeural`), and indexed in `src/lib/audio-manifest.json` as `text -> { voiceId: hash }`. `src/lib/audio.ts` looks a string up there, falls back to platform speech synthesis, and also synthesizes the Web Audio UI feedback sounds. Missing audio is a lint *warning* (fails only with `--strict-audio`); structural data errors always exit 1.

More than one voice exists for a learning reason (high-variability phonetic training — see the header of `voices.ts`): the aspiration and tone **contrast drills vary the talker across trials** and hold it constant within one, so a replay can't change the question. Everything else follows `progress.voice`. The default voice hashes the bare text, so adding a voice never orphans existing files.

`scripts/speakables.ts` is the single collection of every speakable string, imported by **both** `generate-audio.ts` and `lint-content.ts`. A new exercise kind or speakable field goes there and nowhere else.

### Stores vs. pure modules

`*.svelte.ts` files are runes-class singletons that own localStorage; plain `.ts` files are pure and hold the interesting logic, so they can be unit-tested without a DOM:

| Store (`.svelte.ts`) | localStorage key | Pure module it feeds |
| --- | --- | --- |
| `progress.svelte.ts` — XP, streak, stars, crowns, settings, profile | `myanlingo-progress-v1` | `tracks.ts` (routing/suggestions) |
| `srs.svelte.ts` — Leitner boxes per glyph | `myanlingo-script-v1` | `script-session.ts` |
| `vocab-srs.svelte.ts` — Leitner boxes per vocab word + recent mistakes | `myanlingo-vocab-v1` | `practice-session.ts`, `reader-session.ts` |
| `script-sheet.svelte.ts`, `no-audio-prompt.svelte.ts` | (session-only UI state) | — |

The pattern to preserve: session builders take a state snapshot as arguments and return an exercise queue; pages wire the store into them. Don't import stores into the builders.

Both SRS stores use the same 5-box interval ladder (0 / 4h / 1d / 3d / 7d). The box drives the exercise **format**, not just scheduling — box 0–1 recognition, 2–3 production, 4 free recall (see the header comment in `practice-session.ts`).

There is a **second scheduler** for words only: `sm2.ts` (SM-2, three grades — again/good/easy), used when `progress.selfReview` is on. It writes `ease`/`interval`/`reps` onto the *same* vocab entry, so the setting can be toggled either way without losing a word's history; `vocabSrs.gradeSelf` moves the box alongside it so guided review stays in step. `/practice` is a two-line route that picks `GuidedPracticeSession` or `SelfReviewSession` on that setting — the two sessions share nothing else, and neither knows the other exists.

### Lesson parts

A lesson is 2–3 **parts** (`step` on an exercise, `lessonSteps` / `stepExercises` / `stepStarsKey` in `course.ts`), each teaching about four new words. Only part 1 gates the next lesson; the rest are optional but are *not* bonus content — 42 of the course's 66 parts are optional, so anything that treats them as an extra hides most of the material. `rounds.ts` is the pure module that owns the vocabulary and the state (`lessonRounds`, `nextOpenRound`, `nextPartOf`) for the path, Today's tile and hero, and the lesson completion screen.

Note for anything rendered on `/learn`: the page server-renders with empty progress and hydrates against localStorage, so **vary attributes, never tag names or block structure** on progress-derived state. A `<svelte:element>` switching `a`/`span` silently stayed a `span` on the client.

### Three tracks and learner profiles

`course` (lesson path, `/`), `reader` (`/reader`, script-only drills over the same course vocab, never shows romanization) and `script` (`/script` Script Studio). `Profile` (`beginner | script-reader | speaker | explorer`) reorders and frames the home screen and tunes content — it must **never hide or lock** a track. `tracks.ts` holds that routing logic.

### Render-time exercise transforms

Two pure modules rewrite an exercise on its way to the screen rather than in the content, and they **compose in this order**:

1. `listen-mode.ts` — `meaningFirst()` swaps a listening drill's Burmese options for their meanings when `readsScript(profile)` (see `tracks.ts`). Audio plus script options tests spelling recognition, not comprehension. It bails out (returning the drill untouched) when the drill is `keepScript`, when an option has no gloss, when the correct option's gloss isn't the drill's own `en`, or when the meanings would be near-synonyms.
2. `silent-mode.ts` — may then turn that into a reading drill when audio is off.

Both keep `correct` intact, so grading is never affected by either swap.

**Content rules that fall out of this**: don't put romanization in a `note` — it's a static string, so the roman toggle can't switch it off; put the structure in `morphology.ts` instead, which `LearnCard`, `AnswerReveal`, `WordSheet` and the dictionary all render. And don't offer near-synonymous English options (`near-synonyms.ts` is the shared rule, used by both `lint:content` and the transform above). Both are lint warnings.

### Silent mode is a content contract

`progress.audioOn` = permanent `sound` setting AND not `tempMute` (the session-only "no headphones" mute, deliberately unpersisted). `silent-mode.ts` guarantees the learner never meets an unanswerable question: applied at *render* time, listening drills convert into reading drills over the same options and correct index (so grading is untouched), and audio-only Script Studio drills are skipped. Any new audio-dependent exercise kind needs a case here.

### Other cross-cutting pieces

- **Theme** — tokens in `src/app.css` (`--gold`, `--heat-0..4`, etc.), light/dark via `data-theme` on `<html>`. An inline script in `app.html` reads the progress key and applies it **pre-paint**; `progress.applyTheme()` keeps it in sync. Style with the tokens, not literal colors.
- **Immersion mode** — `i18n.svelte.ts` swaps UI strings to Burmese in 3 tiers gated on how many glyphs the learner has met. New user-facing chrome strings belong in its `STRINGS` map.
- **Hub shell and navigation** — `src/lib/nav.ts` owns which routes are hubs, which tab each belongs to, and the shared header title. The **root layout** (`src/routes/+layout.svelte`) renders the `.hub-page` wrapper and `HubHeader` for hub routes, so the header is created once and survives navigation between hubs rather than being rebuilt per page. A new hub is added by listing it in `nav.ts`, not by copying a wrapper into the page. `nav.test.ts` enforces the invariants: every tab's `href` satisfies its own predicate, every hub lights exactly one tab, and every titled route has the shell.
- **Modal overlays** — `ScriptSheet` (the script table) and `WordSheet` (a dictionary entry, opened by "Look it up" on a wrong-answer reveal) both live once in the root layout and are driven by session-only stores. A player must never navigate away mid-session: the queue is rebuilt on mount, so leaving and coming back lands the learner on a *different* question. Every player's keyboard handler guards with `overlayOpen()` from `overlays.svelte.ts` — add a new overlay there, not to the five call sites, or digits will answer the question hidden behind it.
- **Service worker** — `src/service-worker.ts` precaches the app shell but excludes `/audio/` (cached lazily on play). The explicit route list lives in `src/lib/shell-pages.ts`; **add new static routes there** or an offline reload 404s. `shell-pages.test.ts` diffs the list against the routes on disk, so forgetting fails `bun run test` rather than shipping.
- **e2e** — tests seed the progress key with `{ sound: false, profile: 'beginner' }` and wait on `body[data-hydrated="true"]`. Keep that attribute and don't break exact-text card labels casually.

## Conventions

- Formatting is not uniform: `src/lib/**` and `src/routes/**` use tabs + single quotes; `src/lib/data/course.ts` uses 2-space indent + double quotes. Match the file you're in.
- Comments in this codebase explain *why* a design choice was made (see the header comments in `silent-mode.ts`, `practice-session.ts`, `vite.config.ts`). Follow that register rather than narrating what the code does.
- No em dashes in user-facing copy (see commit `205d42d`).
- `IDEAS.md` is the roadmap/backlog with ✅/💤 markers; update it when landing something it lists.
