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
| `FROM_EMAIL` | Verified Resend from-address |
| `CONTRACTOR_EMAIL` | Inbox that receives new-lead alerts |
| `LEAD_ALERT_BCC` | Optional extra copy of contractor alerts |

Apply `supabase/migrations/001_leads_rls.sql` in the Supabase SQL editor so Row Level Security is enabled and the anon key cannot read leads.

If you previously committed Resend API keys, rotate them in the Resend dashboard. This repo no longer embeds fallback keys.
