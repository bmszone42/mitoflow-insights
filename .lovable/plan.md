# Account-backed scenarios

## What you get
- Sign in (email + password, plus Google) from a small account button in the header.
- Signed in: scenarios save to your account and appear on any device or browser session. Compare works on these saved scenarios.
- Signed out: the app still works exactly as now, saving to this browser only.
- First sign-in: a prompt offers to copy your existing browser scenarios into your account (one click, nothing deleted locally).
- Micrograph thumbnails and AI notes saved with a scenario travel with it.

## Technical details
- Enable Lovable Cloud.
- Migration: `scenarios` table (id, user_id, name, inputs jsonb, geometry jsonb, notes jsonb, micrograph jsonb, created_at, updated_at). GRANTs to authenticated/service_role, RLS: owner-only select/insert/update/delete via `auth.uid() = user_id`. No anon access.
- `src/lib/mito/scenarios.ts` becomes a storage facade: same API (list/save/rename/delete/import/export), routes to Cloud when a session exists, IndexedDB otherwise. Scenarios.tsx and Compare.tsx keep their current calls.
- New public `/auth` route (sign in / sign up, Google via Lovable broker, redirect back to `/`). Workspace stays public; no route gate.
- `onAuthStateChange` wired once in `__root.tsx` to refresh the scenario list.
- Micrograph thumbnail stays a small data URL in jsonb (already resized), so no file storage needed yet.
- Update AGENTS.md (replace the "IndexedDB, no accounts" rule) and progress.md, including security notes (RLS, per-user data, AI rate limits could later move to Cloud).
