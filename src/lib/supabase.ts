// Optional Supabase client for cross-device sync. Everything downstream of
// this file must treat `supabase` as possibly `null`: the app has to build
// and run exactly as it does without an account when there's no project
// configured, which is the normal case for local dev, CI and anyone who
// forks this repo without setting up Supabase.
//
// Deliberately `$env/dynamic/public`, not `$env/static/public`: the static
// module only exports names that were actually present at build time, so
// importing an unset `PUBLIC_SUPABASE_URL` from it fails the *build*, not
// just the runtime check — there is no way to "hide the UI" from a build
// error. The dynamic module always exists and reads `undefined` for an unset
// var, which is exactly the fallback this file is built around.
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = env.PUBLIC_SUPABASE_URL;
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

/** True when both env vars are present — gates all sync UI and logic. */
export const syncConfigured = Boolean(url && anonKey);

/**
 * The Supabase client, or `null` when sync isn't configured or we're not in
 * a browser (auth session storage needs `window`, and this app has no server
 * routes that would need the client during SSR).
 */
export const supabase: SupabaseClient | null =
	browser && syncConfigured ? createClient(url as string, anonKey as string) : null;
