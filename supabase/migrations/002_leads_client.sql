-- Tag each lead with the site it came from (demo.quotramax.com → 'demo').
-- Run in the Supabase SQL editor after deploying the client-slug app change.

alter table public.leads add column if not exists client text;

create index if not exists leads_client_idx on public.leads (client);
