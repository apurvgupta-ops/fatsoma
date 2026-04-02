# Architecture (Current)

This codebase uses a split multi-app layout (no Turborepo/workspaces):

- `api`: Express 5 + Mongoose + JWT + Stripe
- `web`: Next.js 16 public app
- `admin`: Next.js 16 admin panel

Shared contracts and API client code are vendored locally inside `web/src/lib/*`, `admin/src/lib/*`, and `api/src/shared`.

## Runtime defaults

- API: `http://localhost:3016`
- Web: `http://localhost:3001`
- Admin: `http://localhost:3003`
