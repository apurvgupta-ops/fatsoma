# Fatsoma (Split Repos Structure)

This repository is no longer a monorepo.

It now contains three independent apps:

- `api` (Express + MongoDB)
- `web` (Next.js public app)
- `admin` (Next.js admin app)

Each app has its own `package.json`, scripts, and environment files.
Install dependencies per app:

```bash
cd api && npm install
cd ../web && npm install
cd ../admin && npm install
```

Run apps independently:

```bash
# API
cd api
npm run dev

# Web
cd web
npm run dev

# Admin
cd admin
npm run dev
```

Notes:

- API serves uploads from `api/uploads`.
- API writes logs to `api/logs` by default.
- API reads env from `api/.env.local` then `api/.env`.
- `web` and `admin` read `NEXT_PUBLIC_API_URL` from their own env files.
