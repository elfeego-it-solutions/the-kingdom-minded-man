# Supabase Setup — Men's Conference 2026

This app uses **your own Supabase project** as the single source of truth.
Lovable Cloud is NOT used.

## 1. Create the database schema

1. Open your Supabase project → **SQL Editor** → **New query**
2. Copy the entire contents of [`db/schema.sql`](./db/schema.sql)
3. Paste and click **Run**

This creates:

- `conference_registrations` — full attendee registrations
- `conference_questions` — anonymous questions
- `dp_generations` — DP generation analytics

RLS is enabled with no policies. All access is server-side via the
`service_role` key (never exposed to the browser).

## 2. Configured secrets (already saved)

The following secrets are already stored in this Lovable project:

| Secret                          | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `APP_SUPABASE_URL`              | Your Supabase project URL                |
| `APP_SUPABASE_ANON_KEY`         | Publishable anon key                     |
| `APP_SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS                |
| `ADMIN_PASSWORD`                | Password for the `/admin` login          |
| `SESSION_SECRET`                | Signs the admin session cookie           |

## 3. Deploying elsewhere (Vercel / Netlify)

Set the same environment variable names on your hosting platform. Nothing
else changes — the database lives in your Supabase project and is fully
under your control.

## 4. Admin dashboard

Visit `/admin`, enter the password you set as `ADMIN_PASSWORD`, and you'll
land on the analytics + registrations + questions dashboard with CSV / Excel
export.
