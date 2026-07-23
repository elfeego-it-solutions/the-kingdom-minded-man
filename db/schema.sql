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
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Ensure updated_at exists on pre-existing installations
alter table public.conference_registrations
    add column if not exists updated_at timestamptz not null default now();

-- UNIQUE constraint on phone (prevents duplicate registrations)
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'conference_registrations_phone_key'
    ) then
        alter table public.conference_registrations
            add constraint conference_registrations_phone_key unique (phone);
    end if;
end$$;

create index if not exists conference_registrations_created_at_idx
    on public.conference_registrations (created_at desc);
create index if not exists conference_registrations_phone_idx
    on public.conference_registrations (phone);
create index if not exists conference_registrations_church_idx
    on public.conference_registrations (church);

create table if not exists public.conference_questions (
    id          uuid primary key default gen_random_uuid(),
    question    text        not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.conference_questions
    add column if not exists updated_at timestamptz not null default now();

create index if not exists conference_questions_created_at_idx
    on public.conference_questions (created_at desc);

create table if not exists public.dp_generations (
    id            uuid primary key default gen_random_uuid(),
    fullname      text,
    phone         text,
    generated_at  timestamptz not null default now()
);

alter table public.dp_generations
    add column if not exists fullname text;
alter table public.dp_generations
    add column if not exists phone text;

create index if not exists dp_generations_generated_at_idx
    on public.dp_generations (generated_at desc);
create index if not exists dp_generations_phone_idx
    on public.dp_generations (phone);

-- 2. TRIGGER: auto-update updated_at ---------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists set_updated_at on public.conference_registrations;
create trigger set_updated_at
    before update on public.conference_registrations
    for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.conference_questions;
create trigger set_updated_at
    before update on public.conference_questions
    for each row execute function public.set_updated_at();

-- 3. ROW LEVEL SECURITY ---------------------------------------
-- All access is performed server-side using the service_role key
-- (which bypasses RLS). RLS is enabled with no policies, so anon
-- and authenticated Data API calls are denied by default.

alter table public.conference_registrations enable row level security;
alter table public.conference_questions     enable row level security;
alter table public.dp_generations           enable row level security;

-- 4. GRANTS ---------------------------------------------------

grant all on public.conference_registrations to service_role;
grant all on public.conference_questions     to service_role;
grant all on public.dp_generations           to service_role;

-- 5. REPORTING VIEWS ------------------------------------------

create or replace view public.registration_summary as
select
    church,
    count(*)                                    as total_registrations,
    count(*) filter (where email is not null and email <> '') as with_email,
    min(created_at)                             as first_registration,
    max(created_at)                             as latest_registration
from public.conference_registrations
group by church
order by total_registrations desc;

create or replace view public.daily_registration_summary as
select
    (created_at at time zone 'UTC')::date as day,
    count(*)                              as registrations
from public.conference_registrations
group by day
order by day desc;

create or replace view public.daily_dp_generation_summary as
select
    (generated_at at time zone 'UTC')::date as day,
    count(*)                                as dp_generated
from public.dp_generations
group by day
order by day desc;

grant select on public.registration_summary        to service_role;
grant select on public.daily_registration_summary  to service_role;
grant select on public.daily_dp_generation_summary to service_role;
