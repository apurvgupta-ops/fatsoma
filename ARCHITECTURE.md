# Architecture (Current)

No Turborepo/workspaces.

Apps:
- `api`: Express + MongoDB + Stripe
- `web`: Next.js public app
- `admin`: Next.js admin app

Shared contracts/API client code are kept locally inside each app.
