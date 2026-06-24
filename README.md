# secondnest-v2

React + Vite + TypeScript app backed by Supabase.

## Setup

```sh
npm install
cp .env.example .env   # fill in your Supabase project URL and anon key
npm run dev
```

## Deploying to GitHub Pages

Pushing to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the
app and publishes it to GitHub Pages. One-time setup in the repo on GitHub:

1. **Settings → Pages** → set Source to "GitHub Actions".
2. **Settings → Environments** → create an environment named `github-pages` (GitHub creates this
   automatically the first time Pages deploys, but you can create it ahead of time) → add two
   secrets to it:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. In your Supabase project, add the Pages URL (`https://<org>.github.io/secondnest-v2/`) to
   **Authentication → URL Configuration** (Site URL / Redirect URLs), or auth redirects will fail
   on the deployed site.

The build injects those secrets as the same `VITE_*` env vars used locally, and sets the Vite
`base` path to `/secondnest-v2/` to match how GitHub Pages serves project sites.
