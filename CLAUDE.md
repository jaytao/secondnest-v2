# secondnest-v2

## What this app is

A marketplace for parents to give away baby and maternity items they no longer need.

Core features:
1. Account creation
2. Create listings with photos and descriptions
3. Search listings by local area (geographic proximity)
4. Lightweight in-app chat between users so contact info never needs to be shared
5. Tag-based search filters on listings (e.g. item type, age range)

## Stack

- Vite + React 19 + TypeScript (SPA, no SSR framework)
- Supabase: Postgres (with PostGIS for geo search), Auth, Storage (listing photos), Realtime (chat)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts)

## Schema & migrations

Schema lives in `supabase/migrations/*.sql`, applied automatically on push to `main` via the
Supabase GitHub integration (Project Settings → Integrations → GitHub).

Core tables:
- `profiles` — one row per `auth.users`, public-facing display info + general location
- `listings` — items being given away, owned by a profile, has a geo point for local search
- `listing_images` — photos for a listing, stored in the `listing-images` Storage bucket
- `tags` / `listing_tags` — curated taxonomy (category + value, e.g. `item_type=clothing`,
  `age_range=0-3m`) attached to listings for filtering
- `conversations` / `messages` — one conversation per (listing, buyer) pair; messages scoped to
  conversation participants only

All tables have RLS enabled. Listings/tags/images are publicly readable (it's a public
marketplace); writes are restricted to the owning user. Conversations/messages are restricted to
their two participants.
