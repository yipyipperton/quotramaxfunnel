-- One row per paying contractor. The subdomain is the slug:
-- smith.quotramax.com -> slug 'smith'.
-- Run in the Supabase SQL editor after deploying the tenant-routing app change.

create table if not exists public.clients (
    slug text primary key,
    company_name text,
    contractor_email text,
    logo_url text,
    faqs jsonb,
    active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

revoke all on table public.clients from anon, authenticated;

-- No policies on purpose: anon/authenticated cannot read or write.
-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.

-- Onboarding a new customer is one insert:
--
-- insert into public.clients (slug, company_name, contractor_email)
-- values ('smith', 'Smith Roofing', 'office@smithroofing.com');
--
-- Optional branding (logo must be a public https image URL):
--
-- update public.clients
-- set logo_url = 'https://smithroofing.com/logo.png',
--     faqs = '[{"q":"Is the inspection free?","a":"Yes, and there is no obligation."}]'::jsonb
-- where slug = 'smith';
--
-- Turning a customer off after they churn (their page stops taking bookings):
--
-- update public.clients set active = false where slug = 'smith';
