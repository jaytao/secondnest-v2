# secondnest-v2

React + Vite + TypeScript app backed by Supabase.

## Setup

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL and anon key
npm run dev
```

## Deploying to GitHub Pages

The app is served at **https://secondnest.org** via this repo's own GitHub Pages custom domain
([public/CNAME](public/CNAME)). Pushing to `main` runs
[.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the app and publishes
it to GitHub Pages. One-time setup in the repo on GitHub:

1. **Settings → Pages** → set Source to "GitHub Actions", and set Custom domain to `secondnest.org`
   (this should pick up `public/CNAME` automatically once deployed, but set it explicitly if not).
   Enable "Enforce HTTPS" once the certificate provisions.
2. At your domain registrar, point `secondnest.org` at GitHub Pages: add `A` records for the apex
   domain to GitHub's Pages IPs (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`). If you also want `www.secondnest.org` to work, add a `CNAME` record for
   `www` pointing to `jaytao.github.io`.
3. **Settings → Environments** → create an environment named `github-pages` (GitHub creates this
   automatically the first time Pages deploys, but you can create it ahead of time) → add two
   secrets to it:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In your Supabase project, add `https://secondnest.org/**` to **Authentication → URL
   Configuration** (Site URL / Redirect URLs), or auth redirects will fail on the deployed site.
5. If using Google OAuth, add `https://secondnest.org` to the OAuth client's Authorized JavaScript
   origins in Google Cloud Console (the redirect URI stays Supabase's own callback URL — that
   doesn't change).

The build injects those secrets as the same `VITE_*` env vars used locally. The Vite `base` path is
`/` since a dedicated custom domain serves at the root, not a `/repo-name/` subpath.

## Backup: deploying to a plain server

If this ever needs to move off GitHub Pages, [scripts/deploy-server.sh](scripts/deploy-server.sh)
builds the app and `rsync`s `dist/` to any server over SSH — no GitHub Pages dependency. The app
needs no server-side routing config (it has no path-based routes — see CLAUDE.md's "Navigation"
section), so any static file server (nginx, Apache, Caddy) works as-is.

```sh
cp .env.deploy.example .env.deploy   # fill in your server + Supabase details
./scripts/deploy-server.sh
```

Remember to add that server's URL to Supabase's **Authentication → URL Configuration → Redirect
URLs** (and the OAuth client's Authorized JavaScript origins, if using Google sign-in) — the app
won't be reachable there otherwise even though the files deployed fine.
