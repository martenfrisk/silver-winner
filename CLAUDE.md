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

`lint-content.ts` and `generate-audio.ts` collect speakable strings with *identical* logic. If you add a new exercise kind or a new speakable field, update the collection loop in **both** scripts or audio silently goes missing.

### Audio pipeline

Every Burmese string is pre-rendered to `static/audio/<djb2-hash>.mp3` by Edge neural TTS (`my-MM-NilarNeural`), indexed in `src/lib/audio-manifest.json`. `src/lib/audio.ts` looks a string up in that manifest, falls back to platform speech synthesis, and also synthesizes the Web Audio UI feedback sounds. Missing audio is a lint *warning* (fails only with `--strict-audio`); structural data errors always exit 1.

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

### Three tracks and learner profiles

`course` (lesson path, `/`), `reader` (`/reader`, script-only drills over the same course vocab, never shows romanization) and `script` (`/script` Script Studio). `Profile` (`beginner | script-reader | speaker | explorer`) reorders and frames the home screen and tunes content — it must **never hide or lock** a track. `tracks.ts` holds that routing logic.

### Silent mode is a content contract

`progress.audioOn` = permanent `sound` setting AND not `tempMute` (the session-only "no headphones" mute, deliberately unpersisted). `silent-mode.ts` guarantees the learner never meets an unanswerable question: applied at *render* time, listening drills convert into reading drills over the same options and correct index (so grading is untouched), and audio-only Script Studio drills are skipped. Any new audio-dependent exercise kind needs a case here.

### Other cross-cutting pieces

- **Theme** — tokens in `src/app.css` (`--gold`, `--heat-0..4`, etc.), light/dark via `data-theme` on `<html>`. An inline script in `app.html` reads the progress key and applies it **pre-paint**; `progress.applyTheme()` keeps it in sync. Style with the tokens, not literal colors.
- **Immersion mode** — `i18n.svelte.ts` swaps UI strings to Burmese in 3 tiers gated on how many glyphs the learner has met. New user-facing chrome strings belong in its `STRINGS` map.
- **Service worker** — `src/service-worker.ts` precaches the app shell but excludes `/audio/` (cached lazily on play). The explicit route list lives in `src/lib/shell-pages.ts`; **add new static routes there** or an offline reload 404s. `shell-pages.test.ts` diffs the list against the routes on disk, so forgetting fails `bun run test` rather than shipping.
- **e2e** — tests seed the progress key with `{ sound: false, profile: 'beginner' }` and wait on `body[data-hydrated="true"]`. Keep that attribute and don't break exact-text card labels casually.

## Conventions

- Formatting is not uniform: `src/lib/**` and `src/routes/**` use tabs + single quotes; `src/lib/data/course.ts` uses 2-space indent + double quotes. Match the file you're in.
- Comments in this codebase explain *why* a design choice was made (see the header comments in `silent-mode.ts`, `practice-session.ts`, `vite.config.ts`). Follow that register rather than narrating what the code does.
- No em dashes in user-facing copy (see commit `205d42d`).
- `IDEAS.md` is the roadmap/backlog with ✅/💤 markers; update it when landing something it lists.
