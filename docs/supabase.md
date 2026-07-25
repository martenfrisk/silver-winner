# Optional cross-device sync (Supabase)

The app is offline-first and fully usable with no account: every byte of
learner state lives in localStorage, as described in the root `CLAUDE.md`.
This is an *additive* feature on top of that, not a replacement for it — a
signed-out learner sees exactly the app's normal behaviour, and nothing ever
requires an account.

Signing in adds one thing: syncing the six localStorage keys (progress,
script SRS, vocab SRS, custom cards, calibration, confusion matrix) to a
Supabase row, so a learner can pick up their progress on a second device.

## Setup (do this yourself — do not hand real credentials to an agent)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/schema.sql` from this repo. It creates
   one table (`learner_sync`) with row-level security so a learner can only
   ever read or write their own row.
3. In **Authentication > Providers**, confirm Email is enabled. In
   **Authentication > Email Templates**, the "Magic Link" template is used
   as-is — no changes needed for a first pass.
4. In **Authentication > URL Configuration**, add your dev and production
   origins (e.g. `http://localhost:5173`, `https://your-deployed-domain`) to
   the redirect allow list. The app requests a redirect back to `/account`.
5. In **Settings > API**, copy the **Project URL** and the **anon/public**
   key (not the service role key — the client never sees that one).
6. Copy `.env.example` to `.env` and fill in those two values:
   ```
   PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
7. Restart `bun run dev`. The "Sync across devices" section on `/account`
   appears once both env vars are present; it's invisible without them.

Never commit `.env` — it's already gitignored. Never paste real project
credentials into chat with an AI agent; the setup above is meant to be run
by hand.

## How the pieces fit together

- `src/lib/supabase.ts` — creates the Supabase client from
  `$env/dynamic/public` (not `$env/static/public` — see the comment there
  for why: the static module fails the *build* on a missing var, which
  breaks the "must build with no Supabase project" requirement this feature
  was built under). `supabase` is `null`, and `syncConfigured` is `false`,
  whenever the env vars are absent — every consumer treats that as "hide the
  UI", never as an error.
- `src/lib/sync-merge.ts` — pure, DOM-free merge logic. Read its header
  comment for the merge rule and why it's *idempotent* (safe to run on every
  sync, not just the first one) rather than a naive "whole row, last write
  wins". Has full unit test coverage in `sync-merge.test.ts`.
- `src/lib/sync.svelte.ts` — the runes singleton that owns auth state and
  orchestrates pull → merge → push around a magic-link sign-in, plus a
  manual "Sync now" on `/account`. Failures degrade silently to local-only.
- `src/routes/account/+page.svelte` — the "Sync" section: email field when
  signed out, status + sign-out when signed in.
- `supabase/schema.sql` — the one table and its row-level security policies.

## What syncing does and doesn't do

- Sync happens at sign-in (the magic-link redirect landing) and whenever the
  learner taps "Sync now". It does not run silently in the background or on
  every page load — see the header comment in `sync.svelte.ts` for why
  (avoiding a reload loop with Supabase's own session-restore event).
- A sync pull/merge/push ends with a page reload, the same pattern the
  existing Backup/Restore feature already uses, so every store re-hydrates
  from one consistent, merged snapshot rather than being patched live.
- Signing out clears only this device's *sync bookkeeping*. It never touches
  the six learner-state keys — progress made while signed in stays exactly
  where it is, sync connection or not.
- A network failure, a Supabase error, or a corrupt remote row all degrade
  to "stay local-only, try again later" — sync can never destroy or block
  access to what's already in this browser.
