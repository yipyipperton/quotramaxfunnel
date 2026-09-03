This is a [Next.js](https://nextjs.org) project for the Quotramax roof inspection funnel.

## Getting Started

```bash
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LEAD_ACCESS_SECRET,
# RESEND_API_KEY, and CONTRACTOR_EMAIL
npm install
npm run dev
```

Open [http://localhost:8081](http://localhost:8081).

## Production environment

Leads are stored in Supabase. In production the JSON file fallback is disabled, so these variables are required on Vercel (or your host):

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key (never `NEXT_PUBLIC_`) |
| `LEAD_ACCESS_SECRET` | HMAC secret for confirmation tokens (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | Transactional email |
| `FROM_EMAIL` | Verified Resend from-address. Homeowners see this; use `Quotramax Inspections <inspections@quotramax.com>`. `leads@quotramax.com` is rewritten automatically. |
| `CONTRACTOR_EMAIL` | Fallback inbox for new-lead alerts when a client row has no address |
| `LEAD_ALERT_BCC` | Optional extra copy of contractor alerts |
| `REQUIRE_KNOWN_CLIENT` | Set to `true` once every paying slug exists in `clients`, so guessed subdomains stop serving a live funnel |

Apply the SQL in `supabase/migrations/` in order, in the Supabase SQL editor. `001` enables Row Level Security so the anon key cannot read leads.

## Onboarding a customer

One row per paying contractor. The subdomain is the slug, so `smith.quotramax.com` looks up `smith` and their bookings go to their inbox, not the global `CONTRACTOR_EMAIL`.

```sql
insert into public.clients (slug, company_name, contractor_email)
values ('smith', 'Smith Roofing', 'office@smithroofing.com');
```

Then point `smith.quotramax.com` at the Vercel project (a wildcard `*.quotramax.com` record covers every customer at once) and send a test booking.

Their company name replaces the Quotramax wordmark on the page, the from-name on the homeowner email, and the page title. `logo_url` (a public https image) and `faqs` (JSON array of `{"q","a"}`, up to 8) are optional overrides; leave them null to keep the defaults. Lookups are cached for 60 seconds, so an edit takes up to a minute to show.

When a customer churns, `update public.clients set active = false where slug = 'smith';` — their page stops taking bookings and the API rejects submissions for that slug.

If you previously committed Resend API keys, rotate them in the Resend dashboard. This repo no longer embeds fallback keys.
