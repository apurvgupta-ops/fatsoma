#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────
REMOTE_USER="onthelistapp"
REMOTE_HOST="77.68.22.68"
REMOTE_DIR="public_html"
SSH_PORT=22
# ─────────────────────────────────────────────────────────────────────

REMOTE="${REMOTE_USER}@${REMOTE_HOST}"

# SSH multiplexing so password is entered only once
SOCKET="/tmp/deploy-otl-$$"
MUX="-o StrictHostKeyChecking=no -o ControlMaster=auto -o ControlPath=${SOCKET} -o ControlPersist=300"

cleanup() { ssh -o ControlPath="${SOCKET}" -O exit "${REMOTE}" 2>/dev/null || true; }
trap cleanup EXIT

echo ">>> Connecting to ${REMOTE} (enter password once) …"
ssh ${MUX} -p ${SSH_PORT} -fN "${REMOTE}"
echo ">>> Connected!"

sshr()  { ssh  ${MUX} -p ${SSH_PORT} "${REMOTE}" "$@"; }
scpr()  { scp  ${MUX} -P ${SSH_PORT} "$@"; }
scprd() { scp  ${MUX} -P ${SSH_PORT} -r "$@"; }

R="${REMOTE}:${REMOTE_DIR}"

# ── 1. Create a local tarball of everything the server needs ─────────
echo ""
echo ">>> Creating deploy tarball (this takes a minute) …"
tar czf /tmp/otl-deploy.tar.gz \
  --exclude='node_modules/.cache' \
  --exclude='node_modules/.package-lock.json' \
  package.json \
  package-lock.json \
  ecosystem.config.js \
  tsconfig.base.json \
  .env \
  .env.local \
  node_modules/ \
  apps/api/dist/ \
  apps/api/package.json \
  apps/web/.next/ \
  apps/web/next.config.ts \
  apps/web/package.json \
  apps/admin/.next/ \
  apps/admin/next.config.ts \
  apps/admin/package.json \
  packages/shared/dist/ \
  packages/shared/package.json \
  packages/api-client/dist/ \
  packages/api-client/package.json

# Include public dirs if they exist
for d in apps/web/public apps/admin/public; do
  if [ -d "$d" ]; then
    tar rzf /tmp/otl-deploy.tar.gz "$d/"
  fi
done

TSIZE=$(du -h /tmp/otl-deploy.tar.gz | cut -f1)
echo ">>> Tarball ready: ${TSIZE}"

# ── 2. Upload tarball ────────────────────────────────────────────────
echo ""
echo ">>> Uploading to server …"
scpr /tmp/otl-deploy.tar.gz "${R}/otl-deploy.tar.gz"

# ── 3. Extract on server ─────────────────────────────────────────────
echo ""
echo ">>> Extracting on server …"
sshr "cd ${REMOTE_DIR} && tar xzf otl-deploy.tar.gz && rm otl-deploy.tar.gz"

# ── 4. Restart PM2 ──────────────────────────────────────────────────
echo ""
echo ">>> Restarting PM2 …"
sshr "cd ${REMOTE_DIR} && (pm2 restart ecosystem.config.js 2>&1 || pm2 start ecosystem.config.js 2>&1)"

# ── Cleanup local tarball ────────────────────────────────────────────
rm -f /tmp/otl-deploy.tar.gz

echo ""
echo ">>> Deploy complete!"
echo "    web:   https://onthelistapp.co.uk"
echo "    admin: https://admin.onthelistapp.co.uk"
echo "    api:   https://api.onthelistapp.co.uk"
