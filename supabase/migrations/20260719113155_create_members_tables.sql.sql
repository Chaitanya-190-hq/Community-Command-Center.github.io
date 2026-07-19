/*
# Create community member tables

## Purpose
Stores Discord-style community member data for the Unison Community dashboard.
Single-tenant app with no auth — the dashboard reads/writes as the anon role.
Any visitor can view members; admin actions (add/edit/delete) are intentionally
open via the anon key because there is no sign-in requirement in this app.

## New Tables

### `server_info`
- `id` (int, primary key, always 1) — singleton row holding server metadata.
- `server_name` (text, not null) — display name shown in hero header.
- `server_id` (text) — external Discord guild id, kept for reference.
- `exported_at` (timestamptz) — when data was last imported/refreshed.

### `members`
- `id` (text, primary key) — Discord snowflake id; stable external identifier.
- `username` (text, not null) — unique @handle.
- `display_name` (text, not null) — pretty name shown on cards.
- `avatar` (text) — avatar URL (nullable; UI falls back to a gradient).
- `bot` (boolean, default false) — whether the member is a bot.
- `joined_at` (timestamptz, not null) — when the member joined the community.
- `created_at` (timestamptz, default now()) — row insert time.
- `roles` (text[], default '{}') — array of role names the member holds.

## Security
- RLS enabled on both tables.
- Policies allow `anon, authenticated` full CRUD — the dashboard is a
  single-tenant public tool with no sign-in screen, so the anon-key client
  must be able to read and write. `USING (true)` is acceptable here because
  the data is intentionally shared/public.
*/

CREATE TABLE IF NOT EXISTS server_info (
  id int PRIMARY KEY DEFAULT 1,
  server_name text NOT NULL,
  server_id text,
  exported_at timestamptz
);

ALTER TABLE server_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_server_info" ON server_info;
CREATE POLICY "anon_select_server_info" ON server_info FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_server_info" ON server_info;
CREATE POLICY "anon_insert_server_info" ON server_info FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_server_info" ON server_info;
CREATE POLICY "anon_update_server_info" ON server_info FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_server_info" ON server_info;
CREATE POLICY "anon_delete_server_info" ON server_info FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS members (
  id text PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  avatar text,
  bot boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  roles text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_members_bot ON members (bot);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON members (joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_roles ON members USING GIN (roles);
