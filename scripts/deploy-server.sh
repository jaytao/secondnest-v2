#!/usr/bin/env bash
#
# Backup deploy path: build the app and rsync it to a plain server over SSH,
# in case this ever needs to move off GitHub Pages. Works with any static
# file server (nginx, Apache, Caddy) since the app has no path-based routing
# to configure server-side — see CLAUDE.md's "Navigation" section.
#
# Usage:
#   DEPLOY_HOST=example.com DEPLOY_USER=deploy DEPLOY_PATH=/var/www/secondnest \
#     VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... \
#     ./scripts/deploy-server.sh
#
# Or copy .env.deploy.example to .env.deploy and fill it in, then just run
# ./scripts/deploy-server.sh — it's sourced automatically if present.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.deploy ]; then
  # shellcheck disable=SC1091
  source .env.deploy
fi

: "${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. example.com)}"
: "${DEPLOY_USER:?Set DEPLOY_USER (the SSH user on the remote server)}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (the remote web root, e.g. /var/www/secondnest)}"
: "${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_ANON_KEY:?Set VITE_SUPABASE_ANON_KEY}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
SSH_KEY_ARGS=()
if [ -n "${DEPLOY_SSH_KEY:-}" ]; then
  SSH_KEY_ARGS=(-i "$DEPLOY_SSH_KEY")
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building (base path: /)"
# VITE_SUPABASE_URL/ANON_KEY get baked into the build; base stays "/" since a
# plain server serves this at its own root, same as the secondnest.org custom
# domain setup (not a /repo-name/ subpath).
VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  npm run build

echo "==> Syncing dist/ to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
rsync -az --delete \
  -e "ssh -p ${DEPLOY_PORT} ${SSH_KEY_ARGS[*]}" \
  dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo "==> Done. Point your web server's root at ${DEPLOY_PATH} (no special SPA"
echo "    rewrite rules needed — this app doesn't use path-based routing)."
echo "    Remember: Supabase's Redirect URLs allow-list needs this server's"
echo "    URL added, or OAuth logins will fail."
