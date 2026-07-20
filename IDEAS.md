# MyanLingo — Ideas & Roadmap

Backlog of improvements and next steps, roughly ordered by expected impact within
each group. Everything fits the localStorage-only, no-backend setup.

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
18. 💤 **Voice option in settings** — offer the male voice
    (`my-MM-ThihaNeural`) alongside the female one; volume sliders for SFX vs.
    speech.
19. 💤 **Accessibility pass** — focus management when exercises swap, `aria-live`
    verdict announcements, discoverable trace-skip path.
20. 💤 **Progress export/import** — download/restore a JSON backup of the
    localStorage keys from the profile page.

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
