-- =============================================================
-- Men's Conference 2026 — Christ Embassy Karu 1
-- Initial schema for your own Supabase project.
--
-- HOW TO RUN:
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this entire file
--   3. Click "Run"
-- =============================================================

-- 1. TABLES ----------------------------------------------------

create table if not exists public.conference_registrations (
    id          uuid primary key default gen_random_uuid(),
    fullname    text        not null,
    email       text,
    phone       text        not null,
    church      text        not null,
    cell        text        not null,
    created_at  timestamptz not null default now()
);

create index if not exists conference_registrations_created_at_idx
    on public.conference_registrations (created_at desc);

create table if not exists public.conference_questions (
    id          uuid primary key default gen_random_uuid(),
    question    text        not null,
    created_at  timestamptz not null default now()
);

create index if not exists conference_questions_created_at_idx
    on public.conference_questions (created_at desc);

create table if not exists public.dp_generations (
    id            uuid primary key default gen_random_uuid(),
    generated_at  timestamptz not null default now()
);

create index if not exists dp_generations_generated_at_idx
    on public.dp_generations (generated_at desc);

-- 2. ROW LEVEL SECURITY ---------------------------------------
-- All access is performed server-side using the service_role key
-- (which bypasses RLS). RLS is enabled with no policies, so anon
-- and authenticated Data API calls are denied by default.

alter table public.conference_registrations enable row level security;
alter table public.conference_questions     enable row level security;
alter table public.dp_generations           enable row level security;

-- 3. GRANTS ---------------------------------------------------

grant all on public.conference_registrations to service_role;
grant all on public.conference_questions     to service_role;
grant all on public.dp_generations           to service_role;
