# Fatsoma (Split Structure)

This repo is split into 3 independent apps (no monorepo/turborepo):

- `api` (Express)
- `web` (Next.js public)
- `admin` (Next.js admin)

Each app has its own `package.json`, `.env`, and `node_modules`.

## Run

```bash
cd api && npm run dev
cd web && npm run dev
cd admin && npm run dev
```

## Ports

- API: `3016`
- Web: `3001`
- Admin: `3003`
