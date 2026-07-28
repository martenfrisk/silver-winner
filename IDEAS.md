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

## Round 13 — the nasal ending, and corpus-mined content (2026-07-25)

- ✅ **သေးသေးတင် (ံ) is taught** — it closes a syllable through the nose
  (ကံ reads like ကန်) and turned up in **58% of utterances** across two open
  Burmese speech corpora, yet had no glyph entry, so the SRS never scheduled
  it. Added to the `killer-stroke` unit alongside asat, which is the same
  job by a different route, with five decodable words and an explainer card.
  A second card introduces ၊ and ။, which stay out of the glyph inventory on
  purpose: they are silent, so a `speak` string for them would be a lie.
  (The tall ါ was checked and is *not* a gap: `TALL_AA` + `buildSyllable`
  generate it and the ာ mnemonic teaches it as a positional variant.)
- ✅ **`bun run mine:corpus`** — proposes new `decodableWords` from OpenSLR
  SLR80 + Google FLEURS, as a TSV worksheet with `roman`/`en` left blank.
  It emits only tokens whose `parts` recompose the word under
  `lint-content.ts`'s own rule, so a glossed row survives the lint; 955
  candidates at ≥5 occurrences and ≥2 talkers, against the 27 decodable
  words that exist today. Corpus files are gitignored and downloaded on
  demand: SLR80 is CC BY-SA 4.0, FLEURS CC BY 4.0, and neither is ours to
  redistribute.
  - **No corpus audio is used, or even downloaded.** The miner reads
    transcripts only; the 904 MB SLR80 zip and the FLEURS audio were never
    fetched. Every MP3 in `static/audio/` is still Edge TTS. What the corpora
    supply is *evidence that human recordings exist*, not the recordings.
  - Talker counts are asymmetric and the column names say so. SLR80 has 20
    real speaker ids; FLEURS exposes only a gender label, so its contribution
    is a floor (two genders are two people) and can never be a count.
    `slr80_talkers` is the only real one: 466 of the 955 candidates clear 3
    distinct talkers, 345 clear 5, and all of them are female, since SLR80 is.
  - The per-token `slr80`/`fleurs` split is the column that matters most.
    SLR80 is 76% colloquial-marker utterances, FLEURS 98% literary: a word
    only FLEURS attests is written Burmese and probably does not belong in
    a spoken-language course.
  - Mining also found the parts model's blind spot: the virama is invisible
    to it, so ကိစ္စ looks readable as soon as က ိ စ are known, long before
    anyone is shown that letters stack. The miner gates stacked words behind
    the `stacked` unit; **`lint-content.ts` has the same hole and does not**.
- 💤 **Gloss the worksheet** — the bottleneck is a Burmese speaker, not the
  data. Same person as #24.
- 💤 **What the corpora cannot do** — measured, so it does not get proposed
  again: **0 of 595** speakable strings appear as a standalone clip, and the
  beginner phrasebook (မင်္ဂလာပါ, နေကောင်းလား) is absent from both corpora
  entirely, because both are read prose. Edge TTS stays for course
  vocabulary. A beginner graded reader is out too: after adding the top 500
  corpus tokens, exactly **one** utterance has no unknown words.
- 💤 **Advanced "written Burmese" track** — FLEURS is 17.6 h of the register
  the course never teaches (သည် ၏ တွင် ၎င်း), both genders, CC BY 4.0,
  transcribed. A learner who finishes the course and opens a news site meets
  it cold. Whole clips need no forced alignment, so this is curation and
  vetting, not a pipeline.
- 💤 **Tone drill on real words** — 20 real-word tone minimal pairs with both
  members attested ≥3× (တောင်/ထောင်, စိတ်/ဆိတ်). Cutting at token boundaries
  avoids the sub-word alignment risk that kept tone out of the Confusion Lab.
  Aspiration gets only ~5 pairs and stays a syllable-level problem.

## Round 12 — the IA restructure (2026-07-25)

The app had grown to 17 routes across three "tracks" and stopped explaining
itself. The cause was a mismatch between the model and the navigation, not
missing links. Five phases, each shipped on its own.

- ✅ **One review surface** (`/review`) over what were four separate
  destinations (`/practice`, `/script/practice`, `/cards`,
  `/script/confusions`). The runners keep their URLs and become decks. The
  combined due count is the tab bar's only badge; confusions are excluded
  from it deliberately, since they have no schedule.
- ✅ **A tab bar that tells the truth.** Two invariants now enforced by
  tests in `nav.ts`: a tab's `href` must satisfy its own predicate (Practice
  used to light on `/cards` while linking to `/practice`), and every hub must
  light exactly one tab (`/reader` and `/stories` lit none).
- ✅ **Shared hub chrome.** `HubHeader` took the dictionary from one entry
  point to six. The **root layout** owns the shell, so the header is created
  once and survives navigation between hubs rather than being rebuilt.
- ✅ **One hero action.** `nextUp()` replaced two cards that answered the
  same question and could disagree; the start chooser stopped replacing the
  page body, so a new learner's first screen went from zero links to four.
- ✅ **One cross-track progress model.** `overview.ts` adds `starKind()`, the
  missing inverse of the three star-key builders, so `progress.stars` can be
  read as a whole for the first time. `/account` went from 6 stats to 12.
- ✅ **The course unit is the spine.** Reading and stories are modes inside
  each unit, not parallel tracks — which is what the data already said, since
  `readerStarsKey()` keys on course unit ids and `stories.requires` is a list
  of course lesson ids.
- ✅ **Progression honesty**: the reader track now seeds and grades the vocab
  SRS (a reader-only learner had an empty review deck forever); one XP table
  in `xp.ts` replaces nine ad-hoc formulas and closes the syllable builder's
  uncapped 2-XP-per-build faucet; streak freezes announce themselves instead
  of being spent in silence.
- ✅ **Optional Supabase sync**, built as an additive layer: localStorage
  stays the source of truth and nothing is login-gated. Reuses `backup.ts` as
  the sync payload. The merge rule is documented and idempotent by design.

## Round 14 — a real SRS for the learners who want one (2026-07-26)

- ✅ **Self-graded word review** (`progress.selfReview`, off by default) —
  `/practice` becomes an Anki-style deck: Burmese on the front, recall the
  meaning, reveal, then grade yourself Again / Good / Easy. Three grades, not
  Anki's four: "Hard" is the one people misuse, and `again`/`good`/`easy`
  already span the range. Each button shows the interval it buys, which is
  what stops Easy becoming the default tap.
- ✅ **SM-2 scheduler** (`sm2.ts`, pure + unit-tested) — per-card ease,
  fixed 1d/6d opening steps, `interval × ease` after that, lapses back inside
  the session at 10 minutes, capped at a year. Runs *alongside* the Leitner
  ladder rather than replacing it: `ease`/`interval`/`reps` are optional
  fields on the same vocab entry, so the setting is safe to toggle both ways,
  and `gradeSelf` still moves the box so guided review's format ladder stays
  in step.
- ✅ **The queue never invents work** — unlike `buildVocabPracticeQueue`,
  which tops a thin session up with the weakest words. A scheduler that
  reviews cards early to fill a session isn't one; if nothing is due, the
  session says so.
- ✅ **Skipped lessons leave the course meter** — waving through the script
  unit ("I know this") used to leave a script-reader stuck at 21/24 forever,
  since skipped lessons can never earn stars. `progress.courseTotal` /
  `overview.courseTotal` drop them from the denominator too, so the meter,
  the home hero and the Graduate achievement all count the learner's own
  course rather than the content's.
- 💤 **Self-graded letters** — the same treatment for the glyph SRS. Held
  back deliberately: Script Studio drills are tracing and sound contrast,
  which have no English "answer" side to grade yourself against.

## Round 15 — lesson parts stop being a secret (2026-07-26)

The deeper rounds were labelled "More words" and "Even more" and reached
through two small chips that only appeared *after* a lesson was finished.
They are not extras: every lesson has a part 2, eighteen have a part 3, each
teaches about as many new words as part 1, and 42 of the course's 66 parts
were living behind those chips.

- ✅ **`rounds.ts`** — one pure module owning the vocabulary ("Part 1/2/3"),
  the per-lesson state, the next open part and the next-part-of-this-lesson
  lookup, so the path, Today and the lesson player can't disagree.
- ✅ **Path**: every lesson shows all its parts as a full-width strip, always,
  including before the lesson is started (locked but visible, so you can see
  a lesson has three parts before choosing to open it). Deeper parts unlock
  together on part 1 — they're siblings, not a ladder. The meta line reads
  "1 of 3 parts done".
- ✅ **Lesson completion** offers "Continue to Part 2" beside "Done for now",
  with the optionality stated. That is the moment a learner has just met four
  words and the rest are right there.
- ✅ **Today**: a dedicated tile ("Carry on with First words · Part 2,
  optional · N parts left"), a "Lesson parts" bar in Your Burmese (`x/42`),
  and `nextUp` offers an unfinished part once the lesson spine is done —
  ahead of the other tracks and well ahead of crown replays, since parts are
  new words and a crown is a replay.
- ✅ **Honest overall progress** — `overallPct` counts parts, so finishing
  every part 1 no longer reads as 100% of a course two thirds untouched.
- 🐛 Fixed in passing: `<svelte:element>` swapping `a`/`span` on
  progress-derived state rendered as `span` with a live `href` after
  hydration. See the note in CLAUDE.md.

## Round 16 — looking a word up stops costing you your place (2026-07-26)

- ✅ **Word sheet** (`WordSheet.svelte`, `word-sheet.svelte.ts`) — "Look it up"
  on a wrong-answer reveal opened `/dictionary?q=<word>`. That card only ever
  shows mid-session, and the players rebuild their queue on mount, so the
  browser Back button — the only way back, and not an obvious one — returned
  the learner to a *different* question than the one they had just missed.
  Now the entry comes to them: definition, SRS strength, morphology, and
  related words, over the top of the session. Related words are tappable and
  swap the sheet rather than navigating.
- ✅ **`word-lookup.ts`** assembles the entry (pure, tested). Handles the case
  the old link quietly failed at too: a reveal can hold a whole phrase with no
  dictionary headword, which now shows its parts instead of "no results".
- ✅ **`overlays.svelte.ts`** — one answer to "is a sheet capturing input?".
  All five players guarded with `|| scriptSheet.open`; a second overlay would
  have meant remembering five sites, and the failure mode is silent (a digit
  answers the question hidden behind the sheet). An e2e test presses `1` with
  the sheet open and asserts nothing happens.
- 🐛 Found while eyeballing it: the entry for မင်္ဂလာပါ listed "The letter
  ga", "nga", "pa" and "ma" as related words. The script lessons teach bare
  glyphs as vocabulary and the greeting contains all four characters —
  sharing a character is orthography, not morphology. Substring matching now
  needs two characters on both sides.

## Round 17 — UAT round 5 (2026-07-26)

Four issues from use, sharing a root: the app was leaking its own
implementation into the teaching.

- ✅ **Romanization out of prose, structure onto the card** — a note read
  "ရေ (yei) is “water”" to a learner who had romanization switched off,
  because a note is a static string. `morphology.ts` already decomposed the
  word properly; `LearnCard` was the one surface that never rendered it. Now
  it does, four question frames were added to the table, and `lint:content`
  warns on romanization in a note (comparing against the course's own
  romanization syllables, so it can tell `(yei)` from `(water)`).
- ✅ **Listening drills that test meaning** (`listen-mode.ts`) — audio plus
  three Burmese options is weak at both ends: a learner who can't read is
  matching shapes, one who can just decodes the options. For the two profiles
  that told us they read Burmese, 26 of the 43 authored drills now ask for the
  meaning instead. The other 17 deliberately don't: the script unit's glyph
  drills and the discourse particles carry `keepScript`, the digit drills have
  no glosses to use, and one is blocked by the ည duplicate.
- ✅ **No more near-synonym options** (`near-synonyms.ts`) — "I'm off now /
  See you / See you tomorrow" asked which English phrase the author picked for
  သွားတော့မယ်, not whether the learner understood it. One shared rule, used by
  `lint:content` when content is written *and* by the transform above when it
  generates options, so it can refuse to build a bad question out of a good
  one. It cannot catch a shared semantic field with no shared words — the
  နော်/ပေါ့/လေ particles — which is what `keepScript` is for.
- ✅ **Frontpage rebalanced** — the streak/XP dial was the second-heaviest
  thing on the page and `/review` was linked twice (as the hero *and* as a
  tile, whenever anything was due). The dial is now a one-line goal bar, the
  tile hides when the hero already points at review.
- ✅ **Week rhythm instead of a streak** (`week.ts`, `WeekRhythm.svelte`) —
  seven dots, filled for days studied, gold when the daily goal was met.
  Missing a day costs one dot and the week refills on its own. A streak works
  by making you afraid to lose it, and tells someone who studies six days a
  week that they have nothing. `progress.streak` stays behind freezes, its two
  achievements and the /account stat — alive, just off the home screen.
- 💤 **Morphology coverage** is 42 of 229 words. Expanding it is the cheapest
  win left on the learn card, but the glosses want the native-speaker pass in
  #24 — several apparent compounds are coincidence (လေး "four" inside ညီလေး
  is a diminutive, not the number).

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

## Round 18 — what a 40-lesson Anki deck taught us to teach (2026-07-28)

A personal Anki collection surfaced "Burmese - Introduction to the Script",
a 40-lesson, 2,760-row deck (2,033 audio clips) that the user wrote and
recorded themselves — self-narrated, licensed content, not a third-party
resource. (First guess in this round was wrong: the public AnkiWeb listing
doesn't credit an author by name and describes it as *"inspired by"* the
Okell textbook, which read as an unlicensed derivative until the user
corrected it. Kept as a memory — [[myanlingo-user-anki-deck]] — since it
was a real misjudgment, not just a fact worth recording.)

Its category tags name five real Burmese orthography phenomena **Script
Studio taught none of**: voicing (156 tagged rows), irregular spelling (63),
the -ည် pronunciation split (74), redundant historical letters ာ/လ် (48),
unstressed-syllable weakening (40). Only stacking (our `stacked` unit)
already overlapped. That's the "advanced reading" gap the corpus-mining
round (#13) went looking for and didn't find.

- ✅ **`voicing` unit** — one new Script Studio unit (no new glyph, same
  shape as `stacked`: `unitNotes` + `decodableWords` only), teaching that a
  word's pronunciation can voice even though the spelling never shows it.
  First pass used a self-authored example (the -ကြီး suffix) built before
  the licensing correction; replaced with a real one once the deck was
  confirmed as the user's own: **မိသားစု** "family" — already the course's
  own Family unit's title word — voices its စု (su → zu), per the deck's own
  note ("သ and စု subject to voicing"). Real audio, not TTS; see the pipeline
  entry below. `unitNotes`' example now contrasts it against စု alone
  (already taught in `round-sounds`, roman "su").
- ✅ **Human-audio overlay, separate from the two TTS voices** — a word can
  now carry a real recording that beats synthesized speech, without
  touching the `f`/`m` voice system built for talker-contrast drills
  (`$lib/voices`). `src/lib/human-audio-manifest.json` (text → hash) is
  checked by `$lib/audio`'s `element()` first, but **only when no specific
  voice is requested** — contrast drills always pass `voice` explicitly, so
  a sparse one-off recording can never silently replace the deliberately-
  picked talker in an aspiration/tone pair. Files live in
  `static/audio-human/`, cached lazily like `static/audio/` (service worker
  updated to exclude both prefixes from precache). `lint-content.ts` treats
  a missing human-audio file as an **error** (never auto-generated, so
  absence means someone deleted or forgot to commit it — unlike ordinary
  TTS coverage gaps, which are just a warning `bun run audio` fixes).
  One entry exists today (မိသားစု, 44.1kHz source re-encoded to the app's
  usual 24kHz/48kbps mono). Scaling this up — which of the deck's 2,760 rows
  are worth pulling in, and whether beyond Script Studio into course
  vocabulary — is future work, not designed yet.
- ✅ **Found and fixed a "Burmese-text → pick the romanization" question in
  two places**, on the user's explicit instruction that this pattern is
  harmful regardless of context: it trains recalling a Latin-letter spelling
  instead of reading the script. `wordRead()` (every decodable-word drill in
  every Script Studio unit, not just `voicing`) and `syllableRead()`'s
  silent-mode fallback both did this. The `recall` exercise kind already
  existed for exactly this reason at the single-glyph level (`g2s`) — it
  just hadn't been extended to whole words. Fixed the same way: audio on →
  self-graded read-aloud (`recall`); audio off → `wordRead` falls back to
  the word's **meaning** (like `sentenceRead` already did), and
  `syllableRead` has no honest silent form for a bare syllable (no meaning
  to fall back to) so it's dropped from the queue, same as the minimal-pair
  and tone drills. Saved as a standing rule:
  [[feedback-no-romanization-questions]].
- ✅ **Three more units, real examples and audio throughout** — the
  remaining phenomena turned out to split into three units, not four:
  weakening and the broader irregular-spelling set share one mechanism
  worth teaching together (spelling just doesn't predict the sound, for
  unrelated reasons), so they became a single unit rather than two thin
  ones.
  - **`nya-endings`** — "One letter, three sounds". ည် closes a syllable
    like အသတ် does, but lands on "i", "eh" or "ay" depending on the word.
    ပြည် (pyi, country), လှည်း (hleh:, cart), အရည် (a-yay, juice — which
    then sounds exactly like ရေ "water", a genuinely useful thing to
    notice). Conditioning cues are the deck's own, not invented: -ယ် mostly
    after တ ထ န မ မှ လ လှ သ, -ေ mostly after ပြ/ဖြ or ရ/ရှ.
  - **`redundant-letters`** — "Letters that go silent". Historical spelling
    outliving the sound it recorded. ဗိုလ် (bo, officer — the whole လ်
    contributes nothing), မာန် (man, pride — ာ is short, not long, despite
    being the "long a" sign everywhere else).
  - **`spelling-surprises`** — "More surprises". ဘုရား (hpa-ya:, pagoda —
    ဘု worn down to almost nothing) and ဘုန်းကြီး (hpoun:-gyi:, monk — ဘ
    heard as ဖ, *and* the same -ကြီး voicing as the `voicing` unit, both at
    once — real words don't respect tidy categories).
  - All seven words: real audio via the human-audio pipeline (Round 18's
    other addition), verified end-to-end in-browser (note cards, the
    self-graded reading drill, the actual `/audio-human/` file fetched on
    "Hear it"). `bun run audio` filled in an ordinary TTS fallback for six
    of the seven (ဘုရား already had one — it's an existing course word).
  - One example scouted and set aside, not attempted: စင်္ကာပူ "Singapore"
    and the same -in-ga- stacked-nasal pattern (လင်္ကာ, သင်္ကန်း) use *kinzi*
    (consonant + nga + asat + virama + consonant), a different device from
    the plain consonant-virama-consonant stacking `stacked` already
    teaches, and not yet modelled in `script.ts`'s decompose/recompose
    rules.

## Round 19 — the deck becomes a content source, not just a topic list (2026-07-28)

Round 18 treated the user's own deck as inspiration only, out of caution
about authorship. The user confirmed ownership outright — *"I did create
that deck and recorded the audio+wrote the text... my audio should be the
default voice"* — which reopens it as a real source, not just a topic list.
Four phases, run in order, each gated on the last staying green
(`lint:content` / `check` / `test`, plus a Playwright pass at the end since
this round touched `course.ts`).

- ✅ **Phase 1 — `bun run match:audio`** (new, reusable). Cross-references
  every speakable string (`collectSpeakables()`) against the deck and
  converts + registers real audio for every exact match — no new content,
  no romanization to derive, since the string is already taught. Idempotent
  (skips strings already in the manifest), so it's meant to be re-run as
  the deck or the course grows. First run: **104 matches**, from core
  phrasebook words (မင်္ဂလာပါ, ကျွန်တော်/ကျွန်မ, ခင်ဗျား) down to bare
  practice syllables the deck's own early lessons drill the same way Script
  Studio does.
- ✅ **Phase 2 — new vocabulary, hand-picked, not mass-produced.** Built
  `bun run scripts/mine-user-deck.ts --kind words` to decompose+filter deck
  rows into unit-placed candidates (326 decodable against today's glyph
  set). Tried mechanizing the romanization too, the way `mine-corpus.ts`
  mechanizes decomposition — and immediately caught why not to: validated
  the candidate romanizer against all 67 *existing* `decodableWords`
  entries and it only got **46 right**. The failures are exactly the
  dangerous kind: real words with no glyph-level marker warning you
  they're irregular (ပါ reads "ba" not "pa", ရတနာ reads "ya-**da**-na" not
  "ya-**ta**-na"), plus a coda-consonant segmentation bug for anything
  closed with အသတ်. So romanization stayed manual, cross-checked against
  *already-validated* entries wherever one existed (ကို "ko" validates
  "အကို" as "a-ko", for instance) — dropped that exact word anyway, since
  "ကို" already means "older brother" in `night-letters` and a second word
  with the same gloss in the same unit is confusing, not additive. Landed
  **11 new decodable words**, real audio throughout, across
  `first-letters`, `hooks-and-tails`, `round-sounds`, `twins-and-hats` and
  `night-letters` — the units whose vocabulary is simple enough (open
  syllables, no asat-coda, no known lexical irregularity) to be confident
  in without hearing the tape. **315 candidates left unmined** —
  `killer-stroke`/`tones`/`blends`/`stacked` account for nearly all of
  them, and that's exactly the asat/medial-heavy territory the romanizer
  validation says needs either audio confirmation or real phonology
  reference-checking, not a rushed guess.
- ✅ **Phase 3 — decodable sentences, same discipline.**
  `mine-user-deck.ts --kind sentences` found 204 candidates; the large
  buckets (`tones` 115, `blends` 74) turned out to be real grammar drills
  (questions with -သလား, aspect marking with -စမှာ, negative imperatives)
  that need grammatical confidence, not just glyph coverage. Added **2**:
  ဟုတ်ပါတယ် "hote-ba-deh" and သိတယ် "thi-deh", both cross-validated against
  romanization patterns already used repeatedly elsewhere in the app
  (-ပါတယ် → "-ba-deh", -တယ် → "-deh").
- ✅ **Phase 4 — a new course unit: "Titles & Roles"** (`titles` /
  `everyday-titles` in `course.ts`). ဆရာ/ဆရာမ (teacher/female teacher),
  ဗိုလ် (officer, already introduced via Script Studio's
  `redundant-letters`) and ဘုန်းကြီး (monk, via `spelling-surprises`) —
  reusing words already vetted for Script Studio, so no new romanization
  risk, just a new place to meet them. Two steps (course convention: every
  lesson has more than one, enforced by `rounds.test.ts`), one `assemble`
  sentence, real audio throughout.
- ✅ **125 words now speak in the user's own voice** (`human-audio-
  manifest.json`), up from 8 at the end of Round 18. `.gitignore` gained
  the raw deck TSV (`/Burmese__BScriptIntro.txt`) alongside `/corpus` —
  regenerable from Anki any time, not something the app ships.
- 💤 **Everything the mining scripts flagged but this round didn't touch**:
  ~315 word candidates and ~200 sentence/phrase candidates, concentrated in
  `killer-stroke`/`tones`/`blends`/`stacked`. Re-running
  `mine-user-deck.ts` any time picks up wherever the app's vocabulary has
  grown to next.

## Round 20 — a reorganization, and testing the limits of safe mining (2026-07-28)

Asked to keep mining Round 19's data source *and* reconsider the course's
shape rather than only appending — not "just add more lessons."

- ✅ **The orphan "Titles & Roles" unit folded into Family.** It was the
  only single-lesson unit in the whole course (every other unit has three),
  and its own content already drew the parallel explicitly — ဆရာ/ဗိုလ်/
  ဘုန်းကြီး are address terms for non-relatives the same way ဦးလေး/အန်တီ
  are in `siblings`. Reused unchanged as Family's 4th lesson
  (`everyday-titles`); no content rewritten, just relocated.
- ✅ **New 5th lesson: `extended-family`** — nephew/niece (တူ/တူမ) and
  parents/grandparents (မိဘ/အဖိုးအဖွား), two steps. တူ and မိဘ were already
  sourced with real audio in Round 19's Phase 2 (Script Studio); reused
  directly rather than re-verified, since the string and its audio don't
  change by appearing in a second place.
- ✅ **One new Script Studio word**: အေး "cold/cool" (`tones` unit,
  `ay:`) — already had real audio from Round 19's Phase 1 match (it's a
  bare syllable Script Studio drills speak anyway), just never had an
  English gloss attached to it as a word. Pairs with the existing ပူ "hot".
- 💤 **A dedicated weather/feelings unit — investigated, not built.**
  Checked what the deck offers beyond အေး: hot (ပူ), happy/sad
  (ပျော်တယ်/ဝမ်းနည်းတယ်), tired/hungry/thirsty
  (ပင်ပန်း/ဗိုက်ဆာ/ရေဆာတယ်) are **already** taught, spread across
  `kids-and-love` and `how-are-you` — the theme is better covered than it
  looked from outside. What's left in the deck for this theme carries more
  romanization risk than what's already shipped, so nothing forced.
- 💤 **Tried to mechanize asat-coda romanization properly, and learned why
  not to.** Round 19 found the coda-consonant reading was context-
  dependent; this round tried to fix it properly by mining the *reading*
  empirically — extracting every (word, romanization) pair from all 425
  `course.ts` + `script.ts` entries and tabulating what each coda consonant
  actually resolves to. Result: a single coda consonant resolves to
  multiple *different* endings depending on what precedes it (`ka` as a
  coda: `-et` four times, but also `-auk`, `-et` again from a different
  vowel, `-ok`, and three more, all attested once each). The reading is a
  property of the whole rime (vowel + coda together), not the coda alone —
  confirming the Round 19 finding harder, not just re-stating it. No
  further mechanization attempted; the ~315/~200 unmined candidates stay
  unmined until either the user's ear or a real rime-level model is
  available.

## Round 21 — lessons with no romanization at all (2026-07-28)

Round 20 ended by saying the coda-romanization problem was a real limit on
how much of the deck's richer, more complex sentences could safely ship.
Asked directly what was stopping a lesson from just not having
romanization — turned out the answer wasn't "a lot," and it dissolves that
limit too: **grading never reads `roman`** anywhere in the app. `listen`
checks a picked option's index against `ex.correct`; `assemble` checks the
joined tile text against `ex.my`. Romanization has only ever been a display
convenience, so a lesson that omits it entirely changes nothing about
correctness — only whether there's a Latin-letter crutch to lean on. That
also means the exact-phonetics risk that gated Round 19/20's mining (the
`killer-stroke`/`tones`/`blends` candidates set aside for needing a
confident romanization) stops applying the moment romanization isn't shown
at all.

- ✅ **`roman` is now optional everywhere it touches course content** —
  `ExerciseBody` (learn/listen/assemble), `VocabItem`, `RecallEx`,
  `SelfReviewCard`, `ReaderVocab`, `RelatedWord`. Eight call sites rendered
  it unconditionally on the `progress.showRoman` toggle without also
  checking the value was present (`LearnCard`, `ListenExercise`,
  `WordSheet` ×2, `RecallCard`, `SelfGradeCard`, the dictionary page ×2) —
  each would have shown an empty line or a bare "()" the first time `roman`
  was actually absent. Fixed by gating on `roman && progress.showRoman`
  throughout, the same pattern `AnswerReveal`'s existing `{#if sub}` already
  used safely.
- ✅ **`Lesson.scriptOnly?: true`** — the flag that means it. `lint:content`
  enforces both directions: a regular lesson's exercises still require
  `roman` (error if missing, same as always), and a `scriptOnly` lesson's
  exercises now error if `roman` is *present*, so the flag can't quietly
  drift from what's actually authored in either direction.
- ✅ **`ScriptOnlyPrompt.svelte`** — a dismissible, non-blocking nudge (chip
  above the exercise, matching `NoAudioPrompt`'s visual language) shown
  entering a scriptOnly lesson when `progress.showRoman` is still on — the
  signal that this learner hasn't leaned on Script Studio yet, and this
  lesson won't have romanization to fall back on. Links to `/script`,
  dismissible, never a gate; session-scoped state
  (`script-only-prompt.svelte.ts`) mirrors `no-audio-prompt.svelte.ts`
  exactly, minus the relocate/tooltip machinery that one needs and this one
  doesn't (it's a lesson-entry nudge, not a per-question concern).
- ✅ **First scriptOnly lesson, `reading-solo`** — added as a 4th lesson
  to `real-talk` (the course's existing capstone unit), not a new
  standalone unit — a single-lesson unit is exactly the "Titles & Roles"
  mistake Round 20 just fixed. It's now the last lesson in the whole
  course. Eight real conversational sentences from the user's own deck
  (ပြန်ပြောပါ။ "Please say that again.", ဘယ်နိုင်ငံက လာသလဲ။ "What country
  does she come from?", …) that would have needed a confident
  romanization to ship under the old rules and now don't. Verified
  end-to-end in-browser with `progress.showRoman` forced on: no
  romanization renders anywhere in the lesson, the nudge shows and
  dismisses correctly and stays dismissed across exercises, real
  `/audio-human/` clips play throughout, and completing it correctly
  triggered the "Graduate" achievement (complete every course lesson) —
  full-circle confirmation that it's wired into the course the same as
  every other lesson.
- 💤 **The larger unmined pool is now lower-risk than it looked** — the
  ~315 word and ~200 sentence candidates from Round 19/20 no longer need a
  trusted romanization if the destination is a scriptOnly lesson. Not
  mined further this round; flagged as the natural next expansion of
  `reading-solo` or a sibling lesson.

## Round 22 — the script-only capstone unit, and Part 4 (2026-07-28)

The previous round's last line was that the unmined pool "no longer needs a
trusted romanization if the destination is a scriptOnly lesson." This round
takes that seriously: the ~90 words added below are shipped without a single
romanization, and none of them needed one.

- ✅ **Part 4 exists** — `LessonStep` is now `1 | 2 | 3 | 4`. Nothing but the
  type and `ROUND_LABELS` bounded the count (every consumer already derives
  its parts from `lessonSteps()`), so the change is four lines: the type, a
  label, the `[1,2,3]` seeding loop in `vocab-srs`, and the `?step=` parser.
  The five other `[1, 2, 3]` loops in the codebase turned out to be
  three-star ratings, not parts — worth checking before assuming a widening
  is invasive. `rounds.test.ts` gained a test that every step a lesson
  declares has a label, since a missing one renders `undefined` as a chip
  caption rather than failing anywhere.
- ✅ **`read-alone` — "Read It Yourself"**, a ninth unit and the course's
  script-only capstone. `reading-solo` **moved here** out of `real-talk`.
  Round 21 put it there to avoid a single-lesson unit (the "Titles & Roles"
  mistake); with five siblings that reasoning inverts — "the part of the
  course you reach once you can read" is a milestone worth seeing on the
  path, not a lesson hiding at the end of an unrelated theme.
- ✅ **Five new scriptOnly lessons, 20 parts, ~90 words**, all four-part:
  `loanwords`, `on-the-map`, `around-myanmar`, `streets-and-signs`,
  `burmese-names`. Course totals: 27 → 32 lessons, 73 → 93 parts,
  246 → 336 learn exercises.
- ✅ **Why these themes, specifically** — loanwords and proper nouns are the
  one class of vocabulary where *the meaning is the pronunciation*. A
  learner who decodes ကော်ဖီ and lands on "coffee" has verified their own
  decoding with nothing but their ear; a romanization printed beside it
  would have given the answer away rather than confirmed it. That is not a
  workaround for the romanizer's limits (Round 19) — it is strictly better
  teaching, and it is why this unit could be authored at four times the
  size of `reading-solo` without the risk that gated Rounds 19–21.
- ✅ **86 of 86 new strings play the user's own recording** — every word was
  picked by validating it against the deck TSV *and* `collection.media`
  before authoring, so `bun run match:audio` matched 100% and nothing fell
  through to TTS. The human-audio manifest went 135 → 221 entries. Authoring
  from a pre-validated candidate pool, rather than writing content and
  hoping the audio exists, is the workflow worth keeping.
- ✅ **Morphology carried by the content, not a note** — the suffixes
  နိုင်ငံ "country" (`on-the-map` part 2), မြို့ "town" (`around-myanmar`
  part 1) and လမ်း "road" (`streets-and-signs`, already known from Places &
  Directions) each get a part built around them, so a learner reads them off
  a sign afterwards rather than memorizing sixteen opaque names.
- 💤 **Still unmined**: roughly 470 rows remain in the "words" / "sentences"
  categories, plus ~120 Pali and monk's-name rows that want a human decision
  about whether they're course material at all. Kinzi stacking (စင်္ကာပူ)
  is still not modelled in `script.ts`'s decompose/recompose rules, which is
  what keeps a few place names out of Script Studio's decodable sets.

## Round 23 — compounds, one grammar frame, and an unlocked path (2026-07-28)

- ✅ **`built-from-parts`** — a lesson made entirely of words the course
  already teaches, stuck together: ဘုန်းကြီး + ကျောင်း is a monastery, and
  the deck's own note on စားသောက်ဆိုင် reads "eat-drink-shop". Fifteen new
  `morphology.ts` entries carry the breakdown to the learn card, the word
  sheet and the dictionary.
- ✅ **The finding that decided where compounds live** — a compound *voices
  at its seam* (ကြီး is already "gyi:" inside ဘုန်းကြီး; ဆိုင် softens after
  လက်ဖက်ရည်), so a romanization built by concatenating the parts' own
  romanizations is wrong in exactly the places the lesson is about. The
  vocabulary that best builds on prior words is therefore the vocabulary
  most exposed to Round 19's romanization problem — which is a reason to
  put it in the script-only track, not a reason to skip it.
- ✅ **`saying-what-you-want`** — ချင် as a reusable frame. The course had
  been using it unnamed since `yummy` (စားချင်တယ်, သောက်ချင်တယ်); naming it
  turns two words into a pattern that takes any verb the learner has.
- ✅ **`asking-your-way`** — the unit's payoff: this unit's street names in
  front of Places & Directions' question words, and part 4 answers the
  question `reading-solo` teaches you to ask (ဘယ်နိုင်ငံက လာသလဲ။).
- ✅ **`Lesson.optional`** — in the path, off the ladder. `loanwords` is the
  first, since "this word was English all along" is a revelation to a
  beginner and barely news to a script reader, who is who that unit is for.
  Generated into `lesson-order.ts` beside `lessonOrder` so `progress` can
  answer without importing `course.ts`.
- ✅ **Lesson previews, and unlocking out of order** — tapping a locked node
  used to buzz. It now opens a sheet listing every word of every part with
  translations, plus "Unlock it anyway". `progress.opened` records only the
  lesson jumped to: nothing before it is marked done or skipped, so the path
  still shows exactly what has been learned. The linear order stays the
  obvious route (it is what the path draws and what "Start here" points at)
  without being a wall. An eye chip on every row previews any lesson,
  including ones already finished.
- 💤 **Two environment notes for whoever verifies next** — the in-app browser
  pane runs with `visibilityState: "hidden"`, so `requestAnimationFrame`
  never fires: Svelte outro transitions freeze and a closed modal stays in
  the DOM. It affects the pre-existing sheets identically, so it is a
  harness artifact, not app behaviour, but it makes modal *close* unverifiable
  there. Separately, `bun run test:e2e` fails "completes lesson 1" under its
  default 4 workers on this machine and passes with `--workers=1`; confirmed
  pre-existing by running the same suite at the previous commit.
