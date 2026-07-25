# MyanLingo — Ideas & Roadmap

Backlog of improvements and next steps, roughly ordered by expected impact within
each group. Everything fits the localStorage-only, no-backend setup — the one
exception is optional Supabase sync (Round 12), which is additive: a
signed-out learner sees the same no-account app as always.

Legend: ✅ = implemented · 💤 = backlog

## Round 4 — user-testing fixes (2026-07-20)

All six items from the first user-testing round, ✅ implemented:

- ✅ **One-tap multiple choice** — choice/listen answers check on tap; the
  Check button remains only for assemble (which needs it). Skip stays.
- ✅ **Prominent wrong-answer reveal + audio** — `AnswerReveal.svelte` card
  (green-bordered, script + meaning + replay button) in the wrong footer of
  the lesson player, /practice and /reader; the correct answer's audio
  auto-plays ~0.6s after the buzz. Script Studio drills re-speak the prompt
  on a miss; word/sentence reads speak the answer after misses too.
- ✅ **Daily progress nudge** — home banner with a goal ring: "Start today's
  20 XP" / "N XP to today's goal" / "Daily goal reached! 🎉", plus a single
  suggested action (due words > due glyphs > next lesson > crown run).
- ✅ **Quick-access script table** — `ScriptSheet.svelte` overlay (global,
  in the root layout, opened via `scriptSheet.show()` from the က button on
  home / lesson / practice / reader headers). Chart sections + sounds +
  SRS heat; tap a glyph to hear its name.
- ✅ **Reader track** — third track at `/reader` for script-readers who
  don't know the language: per-unit sessions from course vocab, script-only
  (options never carry roman subs), forms rotate audio→script,
  script→meaning, meaning→script. Stars stored as `reader-<unitId>` in the
  existing stars map; XP via `completeLesson`.
- ✅ **Audio-first Script Studio** — (a) `s2g` drills now play the letter's
  spoken name ("which one did you hear?") instead of romanized "sounds like
  k" (digits keep written prompts); (b) **Loanword Lab** (`/script/loanwords`,
  card on the studio hub): decode familiar borrowed words (ကော်ဖီ, ဟိုတယ်,
  ကွန်ပျူတာ…) — first a decode pass where the audio is *held back* until you
  answer (`speakAfter`), then a hear→find-it-written pass. Zero romanization.
  Data in `loanWords` (script.ts), wired into audio generation + lint.

  Note: `g2s` ("what sound does this make?") still uses romanized sound
  labels — the one remaining romanization in the studio. Fully replacing it
  needs tappable audio options; see #18/#24.

## Round 6 — temporary no-audio mode (2026-07-20)

- ✅ **Session-only mute, separate from the permanent Sound setting** —
  `progress.tempMute` (deliberately *not* persisted — resets on reload,
  matching "just for right now"). `progress.audioOn` getter
  (`sound && !tempMute`) is the single gate `audio.ts`'s `play()`/`speak()`
  now check, instead of `progress.sound` directly.
- ✅ **Settings toggle** — a "No-audio mode 🎧" checkbox on the account page,
  next to (but distinct from) the permanent Sound toggle.
- ✅ **In-session prompt** — `NoAudioPrompt.svelte`, shown once per app load
  right where audio would actually play (lesson player, /practice,
  ScriptSession — covers Script Studio practice/learn/Loanword Lab —
  /reader, /stories): "🎧 No headphones? This plays pronunciation out loud."
  with **Mute for now** / dismiss ✕. Once muted, the same slot shows a
  "🔇 Audio muted for this session — Turn back on" chip. Session-scoped
  "seen" state lives in `no-audio-prompt.svelte.ts`, reset on reload by
  design so the nudge can resurface next real session.

## Round 7 — learner profiles: a self-explaining structure (2026-07-20)

The three tracks confused testers ("which do I choose?"). Root cause: home
presented Script Studio, Reader track and the course as peers with no
statement of who each is for. Fix: a **profile** routes between them —
reordering and framing only, never hiding or locking (no silos).

- ✅ **`progress.profile`** — `'beginner' | 'script-reader' | 'speaker' |
  'explorer'` (persisted; `null` = not asked; `reset()` clears it so a fresh
  start re-asks).
- ✅ **`StartChooser.svelte`** — first visit, the home hero becomes Shwe's
  inline question ("What's your Burmese like today?") with the three
  personas + "Just exploring" (→ `'explorer'`, never asks again).
- ✅ **`tracks.ts`** — pure track descriptors with audience one-liners,
  `primaryTrack(profile)` (beginner/explorer→course, script-reader→reader,
  speaker→script) and `suggestFor(profile, state)` (the daily nudge now
  reorders per profile). Unit-tested.
- ✅ **Home restructure** — a big gold "Continue …" card for the primary
  track (next lesson / next reader unit / next script unit); the other two
  tracks collapse into a compact "More ways to learn" list with their
  audience lines; Practice and Stories stay as activity cards; the course
  path always renders below.
- ✅ **Per-profile content tweaks** (one each):
  - *beginner*: listening drills force romanization under options until
    10 glyphs are learned (fixes "tap what you hear" being shape-matching
    for script-illiterate users);
  - *script-reader*: `/practice` skips the recognition rung — production
    formats from box 0 (recognition only exists to scaffold script
    decoding);
  - *speaker*: **⚡ test out** — locked lessons show a chip (speaker
    profile only; the URL works for anyone); a perfect hard-mode run on a
    never-completed lesson completes + crowns it and unlocks the next.
- ✅ **Settings** — "Starting point" picker on the account page.
- ✅ **Cross-link** — Script Studio hub points letter-readers at the
  Reader track.

## Round 6b — no unanswerable exercises while muted (2026-07-20)

Muting has to change *what gets asked*, not just silence the speaker — a
"Tap what you hear" card with no sound is unanswerable. `silent-mode.ts`
handles two shapes differently:

- ✅ **Course `listen` drills convert** — options are written Burmese, so
  only the question is lost. `silentSafe()` swaps it for "Which one says
  *X*?" over the *same options and correct index*, so grading, mistake
  recording and the reveal all keep working. Applied at **render time**
  (`$derived`) in the lesson player, /practice and /reader, so muting
  mid-session converts the drills still ahead rather than stranding the
  learner on one.
- ✅ **Script Studio drills that can't convert get dropped** — minimal-pair
  and tone drills show two written syllables and ask which you *heard*;
  with no audio both options are equally valid, so there's no honest
  silent form. `scriptNeedsAudio()` identifies them (a choice with
  `promptSpeak` and no `promptBig`). Build-time: `listenDrill` returns
  null when muted (callers already fall through to a visual drill), the
  Loanword Lab keeps its visual decode pass and drops its listening pass,
  and `s2g` falls back to the written "sounds like X" prompt — fixing a
  round-4 regression where audio-first `s2g` was unanswerable when muted.
  Render-time: `ScriptSession` removes such a drill from the queue if the
  learner mutes while it's on screen (removed, not skipped, so the
  progress bar's denominator stays honest).
- ✅ **Dead speaker buttons hidden** — `SpeakButton` and the story replay
  buttons don't render while audio is off.

## Round 5 — beating Duolingo on learning science (2026-07-20)

- ✅ **Recall ladder** — the vocab SRS box now drives exercise *format* in
  /practice, not just scheduling: box 0–1 recognition (choice/listen),
  box 2–3 production (`assembleEx` builds the word from grapheme tiles via
  `Intl.Segmenter`), box 4 free recall (`RecallCard.svelte`: see the meaning,
  produce the Burmese mentally, reveal, self-grade — the self-grade feeds
  `vocabSrs.grade`).
- ✅ **Grammar micro-notes at the point of error** — `grammar-tips.ts`: an
  ordered rule list (negation မ…ဘူး, question လား/လဲ, want-to ချင်, future
  မယ်, already ပြီ, progressive နေ, statement တယ်, polite ပါ) matched against
  the missed answer's Burmese; the one most relevant tip renders in
  `AnswerReveal` across lesson/practice/reader. Only shown on mistakes.
- ✅ **Decodable stories** — `stories.ts` + `/stories`: tiny dialogues built
  from taught course vocab (validated by a unit test: every chunk is course
  vocab, pure digits, or explicitly `isNew`-flagged for the 🆕 dot). Chat-
  bubble player: lines appear one at a time with audio, every chunk is
  tap-to-gloss, one comprehension question ends it (first-try = 3 stars,
  XP via `completeLesson('story-<id>')`). Unlock = the `requires` lessons
  completed. 3 stories to start (greeting, tea shop, directions).

  Next content passes: more stories per unit, a slow-audio toggle, and the
  remaining round-5 candidates (record-and-compare tone practice, Myanmar
  keyboard course, retention analytics, review-first gating).

## Round 8 — polish pass: correctness, a11y, payload (2026-07-23)

An audit for UI/UX/perf gaps rather than a feature round. Everything below
landed together; progress export/import (#20) was deliberately left out.

- ✅ **The shuffle was biased** — seven call sites used
  `sort(() => Math.random() - 0.5)`, which is not a shuffle: the comparator
  ignores its arguments, so the result follows V8's sort internals. Measured
  over 200k runs, a 3-option drill left the answer in the last slot 25% of the
  time instead of 33%, and option position is the one cue a learner can
  exploit without knowing any Burmese. Replaced with Fisher-Yates in
  `shuffle.ts`, with a chi-square test over landing position.
- ✅ **Three routes were missing from the service worker shell** — `/reader`,
  `/stories` and `/script/loanwords` 404'd on an offline reload. The list
  moved to `shell-pages.ts` and `shell-pages.test.ts` now diffs it against the
  routes on disk, so it can't silently fall behind again.
- ✅ **Accessibility pass** — see #19.
- ✅ **Course data off every page** — `progress.svelte.ts` imported
  `lessonOrder` from `course.ts`, and the root layout imports progress, so all
  ~2000 lines of exercise content loaded before `/account` could render.
  `lessonOrder` now lives in a generated `data/lesson-order.ts` (emitted by
  `lint:content`, drift-checked by a unit test). The Script Studio dataset
  came off the same path: the achievement asks `srs.unitsDone` directly, and
  `ScriptSheet` dynamic-imports its chart body on first open.
- ✅ **Self-hosted fonts** — the Google Fonts `<link>` was render-blocking and
  cost two extra DNS+TLS handshakes before any text could paint; it also meant
  the offline shell rendered Burmese in a fallback face. Nunito's latin subset
  is declared by hand in `fonts.css` so the four unused subsets (~98KB) stay
  out of the precache.
- ✅ **Audio prefetch** — clips were fetched on first play, and drills
  auto-speak ~350ms after the card mounts. `prefetch()` warms the next card's
  clips during the current one, and populates the SW audio cache as a
  side effect.
- ✅ **Meta description + OpenGraph tags** — the app had no share preview.

## Round 9 — learner-owned content (2026-07-24)

Two features that let the learner act on the course rather than only move
through it, plus the backup that makes owning anything meaningful.

- ✅ **Dictionary** (`/dictionary`) — search every word the course teaches,
  by Burmese, romanization or English. Derived entirely from `allVocab` +
  the vocab SRS, so it persists nothing and shows each word's box heat.
- ✅ **Custom review cards** (`/cards`, `custom-cards.svelte.ts`) — the
  learner writes a front and a back; the card then rides the same 5-box
  Leitner ladder as the vocab and glyph SRS, reviewed by self-grade.
  Fourth localStorage key: `myanlingo-custom-v1`.
- ✅ **Backup and restore** (#20) — see below.

## Round 10 — backup, and hardening the storage layer (2026-07-25)

- ✅ **Progress export/import** (#20) — a Backup section on the account page
  downloads all four localStorage keys as one dated JSON file and restores
  one back. Restore writes the keys and reloads rather than patching live
  stores: the reload re-runs the pre-paint theme script, re-seeds the vocab
  SRS from the restored progress, and removes any chance of two stores
  disagreeing about which learner they belong to. A backup is a whole
  snapshot, so restoring one always writes all four keys — a file exported
  before Script Studio was opened clears script progress rather than
  merging into it.
- ✅ **The storage loaders trusted their own JSON** — three of the four
  stores assigned `JSON.parse` output straight to a declared type, so a
  corrupt key escaped the `try/catch` and threw later, in a component. The
  worst was `custom-cards`, whose payload is a bare array: a stored `"null"`
  parsed fine and then threw on `.filter`. Restore is the one path where
  untrusted JSON reaches storage, so `backup.ts` owns the sanitizers and
  **both** paths use them — a doctored file and a hand-corrupted key are the
  same problem. Boxes are clamped to the ladder, because a box past the end
  of `INTERVALS` schedules `now + undefined` = NaN, an item never due again.
- ✅ **"Reset everything" left the custom cards behind** — `resetAll` never
  touched the fourth key (and `customCards` had no `reset()` to call), so
  the confirm text was lying.

## Round 11 — learning science as the differentiator (2026-07-25)

Four changes chosen for evidence behind them rather than novelty, plus the
lab they fed into. The common thread: the comfortable arrangement is
usually the worse one.

- ✅ **Talker variability in contrast drills** — every string is rendered in
  both Burmese neural voices and the aspiration/tone drills pick a talker
  per trial (high-variability phonetic training). Weaker than the
  literature's paradigm — two vendor voices, not five humans — and with
  only two there's no third to hold out as an unheard test, so the app
  claims nothing about generalization. `progress.voice` covers #18.
- ✅ **Interleaved practice queues** — `introduce()` gives a lesson step's
  cohort one due timestamp and `dueIds()` sorts by due, so the first review
  after a lesson served it as a block. Jittering the due does *not* fix
  that (every lesson-1 word is still due before every lesson-2 word); the
  reorder has to happen after selection.
- ✅ **Retention calibration** — after a correct answer, occasionally "will
  you still know this tomorrow?", then the confrontation when the word
  returns, and a lean on the account page. A review inside 20 hours leaves
  the prediction pending rather than resolving it dishonestly.
- ✅ **Morphological decomposition** — 38 course compounds taken apart, in
  the dictionary and the wrong-answer reveal. Lint enforces that parts
  rebuild the word and that the word is really taught.
- ✅ **Confusion Lab** (`/script/confusions`) — see below.

### The Confusion Lab

Every choice drill already computed the most diagnostic fact available —
not that the learner was wrong but *what they reached for* — and threw it
away, keeping a bare boolean. ခ mistaken for ဂ and ခ mistaken for က are
different problems and the app couldn't tell them apart.

Recording the pair gives a per-learner confusion matrix, which drives a
drill ordered by real blind spots and a map the learner can read. The
trial format is **sorting, not picking**: six audio chips into two bins,
because a two-option "which did you hear?" has a 50% floor, tests
labelling one token rather than the category, and allows no revision.

Scoped to aspiration pairs on purpose. Tone is the other candidate and is
held back: creaky versus high is a phonation difference and the one thing
synthetic speech is least likely to carry faithfully, and training a
contrast on audio that doesn't reliably contain it is worse than not
training it. Tone joins once a native speaker has checked the clips (#24).

Still to come, per the original design: minimal pairs in real sentences
where the confusion changes meaning, as a graduation rung.

## Round 12 — optional cross-device sync (2026-07-25)

- ✅ **Supabase magic-link auth + sync** — a "Sync across devices" section on
  `/account`, invisible with no `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY`
  configured (see `docs/supabase.md`). Reuses `backup.ts`'s existing payload
  shape and sanitizers wholesale rather than inventing a second serialization
  format — a Supabase row gets the same untrusted-input treatment as an
  uploaded backup file. The merge is per-key and, within the two SRS maps,
  per-entry (`seen` primary, `due` tie-break) rather than "whole row, last
  write wins" — see the header of `sync-merge.ts` for the full rule and why
  it has to be idempotent (the payload is a snapshot, not a delta log, so
  summing counters on merge would double-count on every repeat sync).
  Sign-out only forgets this device's sync connection; the six learner-state
  keys are untouched, same as before this existed.

## Highest impact next

1. ✅ **Listening-only exercise type** — the audio pipeline exists but is never the
   *question*. "What did you hear?" (play MP3 → pick the script/meaning) is
   Duolingo's bread-and-butter and we have hundreds of clips ready to drive it.
2. ✅ **Course-side spaced repetition** — SRS currently only covers glyphs.
   Vocabulary from completed lessons should feed a "Practice" button on the home
   path (reuse the Leitner logic in `srs.svelte.ts`), so finished lessons don't go
   stale and there's a daily reason to return after finishing the path.
3. ✅ **More course content** — 4 units is thin. Natural next units: Family,
   Places/Directions, Shopping & money (pairs well with the digits unit), Time &
   days, and a first verbs/sentence-patterns unit. Pure content work.
4. ✅ **Mistake review** — persist recently-missed items and offer a "fix your
   mistakes" session, built on the existing requeue mechanism.
5. ✅ **Daily goal + calendar** — a settable XP goal with a progress ring on home,
   and a month-view activity heatmap on the profile page. The streak exists but
   has no visible "today" target, which is the actual habit hook.

## Script Studio deepening

6. 💤 **Handwriting practice — rebuild the tracing pad** (supersedes
   "stroke-order guidance"). **The whole pad is currently gated off**
   (`TRACING_ENABLED` in `src/lib/script-session.ts`), so no `trace` exercise
   reaches either queue. Two separate defects sank it:
   - *Grading was fake.* Completion was a pixel-coverage ratio — paint over
     ~50% of the glyph's cells and it passed. That can't distinguish writing
     the letter from scribbling across its area, so it cut the exercise off
     mid-letter and passed everyone (which also made #10's SRS grade
     meaningless).
   - *Stroke hints were misaligned.* The paths in `strokeData`
     (`src/lib/data/script.ts`) were authored against an HTML text rendering,
     but the pad paints its glyph with canvas `fillText`, so they landed at
     the wrong scale (~70px of stroke over a ~96px glyph). Separately gated by
     `STROKE_HINTS_ENABLED` in `TraceExercise.svelte`.

   All the code and data are kept. A real rebuild needs per-stroke path
   comparison (direction, order, start point) against authored strokes rather
   than a coverage ratio, and stroke paths derived from the pad's own
   `fillText` metrics.
7. ✅ **Minimal-pair listening drills** — aspirated vs. unaspirated (က/ခ, စ/ဆ,
   တ/ထ) and tone contrasts (မ/မာ/မား). These distinctions are *the* hard part of
   Burmese phonology and the syllable audio set already contains the pairs.
8. ✅ **Decodable sentences** — once a learner knows ~30 glyphs, short real
   sentences (not just words) as a reading "graduation" exercise per unit.
9. ✅ **Stacked consonants (ပါဌ်ဆင့်)** — currently unaddressed; even one intro
   unit makes real-world text much less alien.
10. 💤 **Write-from-memory mode** — tracing with the template hidden (tap to
    peek), as the top SRS box exercise for consonants. *Built once and
    disabled* along with the rest of the tracing pad (see the note under #6):
    its SRS grade was only as good as the pad's pass/fail, which any scribble
    satisfied.

## Gamification & retention

11. ✅ **Achievements** — "First 10 glyphs", "7-day streak", "Perfect lesson ×5",
    "Read your first word"… shown on the profile page.
12. ✅ **Crown levels / lesson leveling** — redo a completed lesson at a harder
    tier (no hints, romanization forced off, timed).
13. ✅ **Streak freeze** — earnable with XP; makes the streak feel ownable rather
    than fragile.
14. ✅ **Combo meter in lessons** — consecutive correct answers give a small XP
    multiplier with escalating SFX.

## UX & polish

15. ✅ **Keyboard shortcuts everywhere** — 1–4 to pick options, Enter to continue,
    in both the course player and Script Studio.
16. ✅ **Dark mode** — the design tokens in `app.css` make this mostly a
    variable swap; the cream/gold palette needs a deliberate dark counterpart.
17. ✅ **PWA / offline** — service worker caching the audio and app shell. Still
    local; makes the phone-home-screen use case work.
18. ✅ **Voice option in settings** — the male voice (`my-MM-ThihaNeural`) is
    selectable alongside the female one (round 11). Volume sliders for SFX vs.
    speech are 💤 still open.
19. ✅ **Accessibility pass** — `VerdictAnnouncer.svelte` mirrors correct/wrong
    into an `aria-live` region (naming the answer, so consecutive correct
    answers stay distinct and actually re-announce); the exercise stage takes
    `tabindex="-1"` and is focused per question, since `{#key idx}` otherwise
    drops focus to `<body>` on every card; and `:focus-visible` rings are
    defined in `app.css` — the chunky buttons are drawn with box-shadow, so the
    UA default ring was invisible under it. Applied to the lesson player,
    /practice, /reader **and** `ScriptSession` (all four surfaces).
    The trace-skip path is moot while the pad is gated off (#6).
20. ✅ **Progress export/import** — download/restore a JSON backup of the
    localStorage keys from the profile page. See round 10.

## Engineering quality

21. ✅ **Unit tests** — `buildSyllable`, SRS scheduling math, and the drill-queue
    generators are pure functions begging for `bun test`.
22. ✅ **Content lint script** — `bun run lint:content`: every exercise's answer
    is among its options, every confusable ID exists, every speakable string has
    an MP3 in the manifest.
23. ✅ **Playwright smoke test** — script a lesson start-to-finish so future
    refactors get caught.
24. 💤 **Native-speaker content audit** — generated syllable romanizations, a few
    mnemonics, and tone representation (creaky/low/high) deserve a human pass.
