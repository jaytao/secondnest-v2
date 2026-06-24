# secondnest-v2

## What this app is

A marketplace for parents to give away baby and maternity items they no longer need.

Core features:
1. Account creation (email/password + Google OAuth)
2. Create, edit, and manage listings with reorderable photos and descriptions
3. Search listings by local area (geographic proximity) plus title/tag filters
4. Lightweight in-app chat between users so contact info never needs to be shared, with
   unread-message tracking
5. Public user profiles (display name, avatar, location, optional intro) viewable from a listing
   or a chat avatar

Production URL: **secondnest.org** (GitHub Pages, custom domain on this repo).

## Stack

- Vite + React 19 + TypeScript (SPA, no SSR framework, no router — see "Navigation" below)
- Supabase: Postgres (with PostGIS for geo search), Auth, Storage (listing photos + avatars),
  Realtime (chat)
- Supabase client: [src/lib/supabase.ts](src/lib/supabase.ts) — uses `flowType: 'pkce'` so OAuth
  tokens never land in the URL

## Schema & migrations

Schema lives in `supabase/migrations/*.sql`. **There is no CI step that applies migrations** —
the `.github/workflows/deploy.yml` workflow only builds and deploys the frontend. Migrations are
applied manually via `supabase db push`, and that command needs the database password, so **Claude
should write the migration file but let the user run `supabase db push` themselves** rather than
attempting it (it'll prompt for a password Claude doesn't have, and the user has asked for this to
be delegated to them).

Core tables:
- `profiles` — one row per `auth.users` (created via a trigger on signup), public display info +
  general location (`location` geography point + denormalized `latitude`/`longitude` generated
  columns, since PostgREST returns raw `geography` as WKB hex otherwise) + optional `introduction`
- `listings` — items being given away, owned by a profile, has its own geo point + `status`
  (`active`/`pending`/`given_away`/`removed`)
- `listing_images` — photos for a listing (`position` determines display order; position 0 is the
  cover photo shown on cards), stored in the `listing-images` Storage bucket
- `tags` / `listing_tags` — curated taxonomy (category + value, e.g. `item_type=clothing`,
  `age_range=0-3m`) attached to listings for filtering
- `conversations` / `messages` — one conversation per (listing, buyer) pair; messages scoped to
  conversation participants only; `buyer_last_read_at`/`seller_last_read_at` track read state for
  unread badges

Other DB objects worth knowing about:
- `nearby_listings(lat, lon, radius_meters)` — RPC for radius search (PostGIS `ST_DWithin`),
  returns ids + distance ordered nearest-first
- `unread_message_counts()` / `mark_conversation_read(conversation_id)` — RPCs backing the unread
  badge
- `reset_dev_data()` — **dev/test only**, deletes all `auth.users` (cascades through everything via
  existing FKs). Not granted to `anon`/`authenticated`; call manually from the SQL editor, never
  from client code.

All tables have RLS enabled. Listings/tags/images/profiles are publicly readable (it's a public
marketplace); writes are restricted to the owning user. Conversations/messages are restricted to
their two participants.

`conversations` has two FKs to `profiles` (`buyer_id`, `seller_id`), so any `.select()` that embeds
`profiles` from `conversations` must disambiguate with `!constraint_name`, e.g.
`profiles!conversations_buyer_id_fkey(...)` — PostgREST can't infer which one you mean otherwise.

## Navigation (no router)

There's no `react-router` — `App.tsx` drives everything with local `useState` (`page`,
`selectedListing`, `viewedProfileId`, etc.), because GitHub Pages doesn't support path-based SPA
routing without extra config (a direct visit to `/listing/123` would 404).

Shareable links instead use **query params** via [src/lib/deepLink.ts](src/lib/deepLink.ts):
`?listing=<id>`, `?profile=<userId>`, `?legal=terms|privacy|about`. Query strings survive on any
static host, unlike path segments. If more than one of these three params is present at once,
whichever appears *first* in the query string wins (`getInitialDeepLink`). `setDeepLinkParam`
always clears the other two when writing one, so the URL never implies more than one current view.
`App.tsx` keeps the URL in sync with whatever's actually rendered via a single `useEffect` watching
`viewedProfileId`/`selectedListing`, rather than scattering URL writes through every click handler.

## Listings: filtering & pagination

`useListings` (in [src/listings/useListings.ts](src/listings/useListings.ts)) does **server-side**
filtering + pagination (`.range()` + `{ count: 'exact' }`), not "fetch everything and filter in
JS". Tag filtering is the one exception that still needs multiple round-trips: PostgREST can't
express "has all of these tags" (AND semantics) as a single filter without a custom view/RPC, so
each selected tag's matching listing ids are fetched separately and intersected client-side
(cheap — ids only, never full rows) before being applied as `.in('id', ...)`.

Desktop shows numbered pages; mobile (`max-width: 640px`, matching the same breakpoint used in
`App.css`) uses infinite scroll via an `IntersectionObserver` sentinel, driven by `useMediaQuery`.

The hardcoded example listings in `dummyListings.ts` only show when the table is genuinely empty —
decided via `useHasAnyListings()`, a separate unfiltered `count`-only probe. Don't change this back
to checking `listings.length === 0` from the paginated query — that would misfire on a legitimately
empty *page* of real results.

## Known gotchas

- **iOS Safari auto-zooms** on any focused `<input>`/`<select>` with `font-size` under 16px. Keep
  form fields at `1rem`+.
- **`supabase.auth.signOut()` (or any other `supabase.auth.*` call) inside an
  `onAuthStateChange` callback can deadlock the client** — defer with `setTimeout(..., 0)`. See the
  comment in `AuthContext.tsx`.
- `AuthContext` force-signs-out a session that has no matching `profiles` row (e.g. after
  `reset_dev_data()`, or a profile deleted independently of its account) — this is intentional, not
  a bug, since the rest of the app assumes every session has a profile.
- OAuth `redirectTo` is computed dynamically (`window.location.origin + import.meta.env.BASE_URL`)
  — never hardcode a domain here. Both the local dev URL *and* the production URL need to be in
  Supabase's **Authentication → URL Configuration → Redirect URLs** allow-list simultaneously; it's
  additive, not either/or.
- Vite dev server is pinned to port 5173 with `strictPort: true` so it fails loudly instead of
  silently moving to 5174+ when the port's busy — keeps the OAuth redirect URL predictable.
- GitHub Pages custom domain is configured via `public/CNAME` (`secondnest.org`) on *this* repo,
  serving at the root — `vite.config.ts`'s `base` is `/`, not a `/repo-name/` subpath.
