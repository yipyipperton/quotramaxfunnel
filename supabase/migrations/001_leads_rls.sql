-- Quotramax leads table + Row Level Security
-- Run in the Supabase SQL editor (or via the CLI) before going to production.
-- The app writes with the service role key, which bypasses RLS.

create table if not exists public.leads (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    address text,
    zip text,
    size integer,
    material text,
    price numeric,
    motivation text,
    age text,
    stories text,
    living_area integer,
    status text,
    date timestamptz default now()
);

create table if not exists public.settings (
    id integer primary key,
    contractor_email text
);

alter table public.leads enable row level security;
alter table public.settings enable row level security;

revoke all on table public.leads from anon, authenticated;
revoke all on table public.settings from anon, authenticated;

-- No policies on purpose: anon/authenticated cannot read or write.
-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
