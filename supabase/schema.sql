-- Schema for optional cross-device sync (see docs/supabase.md).
--
-- One row per signed-in learner, holding a full snapshot of the six
-- localStorage keys the app already knows how to build and sanitize (see
-- src/lib/backup.ts and src/lib/sync-merge.ts) as one jsonb payload, plus
-- the timestamp of the last successful push. There is no history table and
-- no per-field storage: the merge that reconciles two devices' payloads
-- happens client-side, in src/lib/sync-merge.ts, before either side is
-- written anywhere. Read that file's header comment before changing this
-- table shape — it explains why the merge is per-field/per-entry rather
-- than "last write wins" over the whole row.

create table if not exists public.learner_sync (
	user_id uuid primary key references auth.users (id) on delete cascade,
	payload jsonb not null,
	updated_at timestamptz not null default now()
);

alter table public.learner_sync enable row level security;

-- A learner can only ever see or touch their own row. The anon key used by
-- the client relies entirely on these policies — there is no server route
-- in this app that could apply extra checks.
create policy "learner_sync: select own row" on public.learner_sync
	for select
	using (auth.uid () = user_id);

create policy "learner_sync: insert own row" on public.learner_sync
	for insert
	with check (auth.uid () = user_id);

create policy "learner_sync: update own row" on public.learner_sync
	for update
	using (auth.uid () = user_id)
	with check (auth.uid () = user_id);

-- No delete policy: the client never deletes a row. A learner's row is
-- removed automatically when their auth.users row is (account deletion),
-- via the foreign key's `on delete cascade` above.
