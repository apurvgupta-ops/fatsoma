# Fatsoma Clone

A full-stack event ticketing platform built as a **Turborepo monorepo** with four applications and two shared packages. Features include event management, live stock-market-style booking fees, Stripe checkout, and cross-platform support (web + mobile).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Why Turborepo?](#why-turborepo)
- [Folder Structure](#folder-structure)
- [Applications](#applications)
  - [API (`apps/api`)](#api-appsapi)
  - [Admin (`apps/admin`)](#admin-appsadmin)
  - [Web (`apps/web`)](#web-appsweb)
  - [Mobile (`apps/mobile`)](#mobile-appsmobile)
- [API Architecture](#api-architecture)
- [Shared Packages](#shared-packages)
  - [`@fatsoma/shared`](#fatsomashard)
  - [`@fatsoma/api-client`](#fatsomaapi-client)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Turborepo                          │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │   API   │  │  Admin  │  │   Web   │  │  Mobile  │  │
│  │ Express │  │ Next.js │  │ Next.js │  │  Expo    │  │
│  │ :4000   │  │ :3000   │  │ :3001   │  │  :8081   │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬─────┘  │
│       │            │            │             │         │
│       │     ┌──────┴────────────┴─────────────┘         │
│       │     │                                           │
│  ┌────┴─────┴──────────────────────────┐                │
│  │         @fatsoma/api-client         │                │
│  │   (Typed HTTP client for the API)   │                │
│  └────────────────┬────────────────────┘                │
│                   │                                     │
│  ┌────────────────┴────────────────────┐                │
│  │          @fatsoma/shared            │                │
│  │  (Types, Schemas, Constants)        │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

All four applications consume the same shared packages, ensuring type safety and consistency across the entire platform.

---

## Why Turborepo?

[Turborepo](https://turbo.build/repo) is the build system that orchestrates this monorepo. Here is why it was chosen and what benefits it provides:

### 1. Single Repository, Multiple Apps

Instead of managing 4+ separate git repositories (API, Admin, Web, Mobile, shared libraries), everything lives in one place. This means:

- **One `git clone`** to get the entire platform.
- **One `npm install`** to install all dependencies (npm workspaces hoists shared deps to the root).
- **Atomic commits** — a change to a shared type and the API/Web/Mobile that consumes it can all land in a single PR.

### 2. Incremental Builds & Caching

Turborepo tracks the inputs (source files, dependencies, env vars) of every task and caches the outputs. If nothing changed in `@fatsoma/shared`, it won't rebuild it the next time you run `turbo run build`. This dramatically reduces CI/CD times as the project grows.

```
# First run: builds everything
$ npm run build        # ~45s

# Second run: hits cache for unchanged packages
$ npm run build        # ~3s  (cached)
```

### 3. Parallel Task Execution

When you run `npm run dev`, Turborepo starts all four dev servers **in parallel** with a single command. It understands the dependency graph — it knows `@fatsoma/api-client` depends on `@fatsoma/shared`, so it processes them in the correct topological order while still parallelizing independent tasks.

### 4. Dependency Graph Awareness

Turborepo builds a DAG (Directed Acyclic Graph) of your workspace packages. When `apps/web` depends on `@fatsoma/api-client` which depends on `@fatsoma/shared`, Turborepo ensures they build in the right order automatically. You never have to manually specify build sequences.

### 5. Filtered Execution

Need to work on just the API? Run only that:

```bash
npm run dev:api          # Only starts the API server
npm run dev:admin        # Only starts the Admin dashboard
npm run dev:web          # Only starts the public Web app
```

This is powered by Turborepo's `--filter` flag, which runs tasks for a specific package and its dependencies only.

### 6. Shared Code Without Publishing

The `packages/` directory contains internal packages (`@fatsoma/shared`, `@fatsoma/api-client`) that are consumed by all apps via workspace references. There is no need to publish to npm — changes are available instantly to all consumers.

---

## Folder Structure

```
fatsoma-clone/
│
├── apps/
│   ├── api/                        # Express.js REST API (layered architecture)
│   │   ├── src/
│   │   │   ├── index.ts            # Server entry point + createApp()
│   │   │   ├── controllers/        # HTTP layer — parse req, call service, send res
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── checkout.controller.ts
│   │   │   │   ├── event.controller.ts
│   │   │   │   ├── upload.controller.ts
│   │   │   │   └── user.controller.ts
│   │   │   ├── services/           # Pure business logic — no req/res, throws AppError
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── checkout.service.ts
│   │   │   │   ├── event.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── routes/             # Thin — only middleware → controller wiring
│   │   │   │   ├── auth.ts
│   │   │   │   ├── checkout.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── uploads.ts
│   │   │   │   └── users.ts
│   │   │   ├── models/
│   │   │   │   ├── Event.ts        # Mongoose Event schema
│   │   │   │   ├── Order.ts        # Mongoose Order schema (Stripe)
│   │   │   │   └── User.ts         # Mongoose User schema
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # JWT authentication & role guard
│   │   │   │   ├── error.ts        # Global error handler (AppError, Zod, Mongoose)
│   │   │   │   └── validate.ts     # Zod safeParse validation middleware
│   │   │   ├── utils/
│   │   │   │   ├── AppError.ts     # Custom error class with HTTP status codes
│   │   │   │   ├── asyncHandler.ts # Eliminates try/catch in route handlers
│   │   │   │   ├── paramId.ts      # Extract + validate ObjectId from params
│   │   │   │   └── response.ts     # Standardised sendSuccess/sendMessage helpers
│   │   │   ├── lib/
│   │   │   │   ├── db.ts           # MongoDB connection
│   │   │   │   └── jwt.ts          # JWT token generation/verification
│   │   │   └── scripts/
│   │   │       └── seed.ts         # Database seeder
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/                      # Next.js Admin Dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/      # Admin overview
│   │   │   │   ├── events/         # Event list, create, edit pages
│   │   │   │   ├── login/          # Admin login
│   │   │   │   ├── panel/          # Live booking fee trends panel
│   │   │   │   ├── users/          # User management
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── components/
│   │   │   │   ├── events/         # EventFormPrimitives (reusable form fields)
│   │   │   │   └── layout/         # Sidebar, AuthenticatedLayout
│   │   │   └── lib/
│   │   │       ├── api.ts          # Admin API client setup
│   │   │       └── auth-context.tsx # Admin auth state
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                        # Next.js Public Web App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── checkout/       # Stripe checkout success page
│   │   │   │   ├── events/[id]/    # Event detail with live fee + Buy Now
│   │   │   │   ├── login/          # User login
│   │   │   │   ├── signup/         # User registration
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx        # Explore page (event grid)
│   │   │   ├── components/
│   │   │   │   ├── ExploreEventCard.tsx
│   │   │   │   ├── ExploreHeader.tsx
│   │   │   │   └── UserMenu.tsx    # Auth-aware user dropdown
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx  # Web auth state (login/signup/logout)
│   │   │   └── lib/
│   │   │       └── api.ts          # Public + authenticated API clients
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                     # Expo React Native App
│       ├── src/
│       │   ├── components/
│       │   │   ├── EventCard.tsx    # Event card with image overlay
│       │   │   └── SparkLine.tsx    # SVG sparkline chart
│       │   ├── context/
│       │   │   └── AuthContext.tsx  # Mobile auth (SecureStore tokens)
│       │   ├── hooks/
│       │   │   ├── useEvents.ts    # Fetch published events
│       │   │   └── useLiveFee.ts   # Simulated live booking fee
│       │   ├── lib/
│       │   │   └── api.ts          # API client + SecureStore token mgmt
│       │   ├── navigation/
│       │   │   ├── RootNavigator.tsx # Auth ↔ Main stack switching
│       │   │   └── types.ts        # Navigation type definitions
│       │   ├── screens/
│       │   │   ├── EventDetailScreen.tsx
│       │   │   ├── ExploreScreen.tsx
│       │   │   ├── LoginScreen.tsx
│       │   │   ├── ProfileScreen.tsx
│       │   │   ├── SignupScreen.tsx
│       │   │   └── TicketsScreen.tsx
│       │   └── theme/
│       │       ├── colors.ts       # Shared color palette
│       │       ├── index.ts
│       │       └── spacing.ts      # Spacing & border radius tokens
│       ├── App.tsx                  # Root component (AuthProvider + Navigation)
│       ├── index.ts                # Expo entry point
│       ├── app.json                # Expo configuration
│       ├── metro.config.js         # Metro bundler monorepo config
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                     # @fatsoma/shared
│   │   ├── src/
│   │   │   ├── constants.ts        # Event categories, roles, statuses
│   │   │   ├── index.ts            # Barrel export
│   │   │   ├── schemas.ts          # Zod validation schemas
│   │   │   └── types.ts            # TypeScript interfaces
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/                 # @fatsoma/api-client
│       ├── src/
│       │   ├── client.ts           # FatsomaClient class (all API methods)
│       │   └── index.ts            # Barrel export
│       ├── package.json
│       └── tsconfig.json
│
├── uploads/                        # User-uploaded images (served by API)
│
├── package.json                    # Root workspace config + Turbo scripts
├── turbo.json                      # Turborepo pipeline configuration
├── tsconfig.json                   # Root TS config (references)
├── tsconfig.base.json              # Shared compiler options
├── .env                            # Root environment variables
└── .gitignore
```

---

## Applications

### API (`apps/api`)

| | |
|---|---|
| **Framework** | Express.js 5 |
| **Architecture** | Route → Controller → Service → Model |
| **Database** | MongoDB via Mongoose |
| **Auth** | JWT (access + refresh tokens) |
| **Payments** | Stripe Checkout + Webhooks |
| **Uploads** | Multer (file → `uploads/` directory) |
| **Error Handling** | Custom `AppError` class + global handler |
| **Port** | `4000` |

**Key endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | Public | User registration |
| `POST` | `/api/auth/login` | Public | Login (returns JWT tokens) |
| `POST` | `/api/auth/refresh` | Public | Refresh access token |
| `GET` | `/api/auth/me` | Bearer | Get current user |
| `GET` | `/api/events/published` | Public | List published events |
| `GET` | `/api/events` | Bearer | List all events (admin: all, user: own) |
| `GET` | `/api/events/:id` | Bearer | Get single event |
| `POST` | `/api/events` | Bearer | Create event |
| `PUT` | `/api/events/:id` | Bearer | Update event |
| `PATCH` | `/api/events/:id/status` | Bearer | Update event status |
| `DELETE` | `/api/events/:id` | Bearer | Delete event |
| `POST` | `/api/checkout/create-session` | Public | Create Stripe checkout session |
| `GET` | `/api/checkout/session/:id` | Public | Get order by session ID |
| `POST` | `/api/checkout/webhook` | Stripe | Stripe webhook handler |
| `POST` | `/api/uploads` | Bearer | Upload image |
| `GET` | `/api/health` | Public | Health check (uptime + timestamp) |

### Admin (`apps/admin`)

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Auth** | JWT stored in `localStorage` |
| **Port** | `3000` |

The admin dashboard provides:
- Event CRUD (create, edit, publish/draft, delete)
- User management (create, activate/deactivate, role changes)
- Live booking fee panel with stock-market-style indicators and sparkline charts
- Protected routes with sidebar navigation

### Web (`apps/web`)

| | |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Payments** | Stripe.js |
| **Auth** | JWT stored in `localStorage` |
| **Port** | `3001` |

The public-facing web app provides:
- Event discovery with search and category filtering
- Event detail pages with live booking fee trends (stock-market style)
- Ticket selection with dynamic price breakdown
- Stripe-powered checkout flow
- User registration and login
- Responsive, dark-themed UI

### Mobile (`apps/mobile`)

| | |
|---|---|
| **Framework** | Expo SDK 54 / React Native 0.81 |
| **Navigation** | React Navigation (Stack + Bottom Tabs) |
| **Auth** | JWT stored in `expo-secure-store` |
| **Port** | `8081` (Metro bundler) |

The mobile app provides:
- Event browsing with pull-to-refresh
- Event detail with live booking fee sparkline and Buy Now
- Bottom tab navigation (Explore, Tickets, Profile)
- Login/Signup flow with conditional navigation
- Dark theme matching the web app

---

## API Architecture

The API follows a **layered architecture** pattern for production-level code quality:

```
Request → Route → Middleware → Controller → Service → Model → Database
```

### Layer Responsibilities

| Layer | Responsibility | Knows about HTTP? |
|-------|---------------|-------------------|
| **Routes** | Wire middleware to controller methods. ~10 lines per file. | Yes (Express Router) |
| **Controllers** | Parse `req` params/body, call service, format `res`. | Yes (req/res) |
| **Services** | Pure business logic, DB queries, validation. Throws `AppError` on failure. | No |
| **Models** | Mongoose schemas, indexes, virtuals, pre-save hooks. | No |
| **Middleware** | Auth, validation, error handling — cross-cutting concerns. | Yes |
| **Utils** | `AppError`, `asyncHandler`, `paramId`, `response` helpers. | Minimal |

### Why This Structure?

- **Testability** — Services can be unit-tested without spinning up Express. `createApp()` exports the configured app for integration tests.
- **Single Responsibility** — Each layer does one thing. Routes don't contain business logic. Services don't know about HTTP status codes (they throw typed errors instead).
- **No try/catch boilerplate** — `asyncHandler` wraps every controller so thrown errors automatically reach the global error handler.
- **Consistent error responses** — `AppError.notFound()`, `AppError.conflict()`, etc. are caught by the error handler and mapped to the correct HTTP status + `{ ok, message }` JSON shape.
- **Consistent success responses** — `sendSuccess(res, data, message)` and `sendMessage(res, message)` enforce the `{ ok, message, data? }` contract.

### Error Handling

The global error handler (`middleware/error.ts`) maps error types to HTTP responses:

| Error Type | HTTP Status | Example |
|------------|-------------|---------|
| `AppError` | `.statusCode` | `AppError.notFound("Event not found")` → 404 |
| `ZodError` | 400 | Schema validation failure with field-level details |
| Mongoose `ValidationError` | 400 | Model-level validation (e.g. required field) |
| Mongoose `CastError` | 400 | Invalid ObjectId format |
| MongoDB duplicate key (11000) | 409 | Unique constraint violation |
| Multer file size | 413 | File exceeds 5 MB limit |
| Unknown | 500 | Unexpected errors (logged to console) |

---

## Shared Packages

### `@fatsoma/shared`

Contains everything that needs to be consistent across all apps:

- **`types.ts`** — TypeScript interfaces (`EventResponse`, `UserResponse`, `LoginInput`, `RegisterInput`, `ApiResponse`, etc.)
- **`schemas.ts`** — Zod validation schemas used by both the API (request validation) and frontends (form validation)
- **`constants.ts`** — Enums and constants (`EVENT_CATEGORIES`, `USER_ROLES`, `EVENT_STATUSES`, `BOOKING_FEE_PERCENT`)

### `@fatsoma/api-client`

A typed HTTP client class (`FatsomaClient`) that wraps `fetch` and provides methods for every API endpoint:

```typescript
const client = new FatsomaClient({
  baseUrl: "http://localhost:4000",
  getToken: () => localStorage.getItem("accessToken"),
});

const events = await client.getPublishedEvents();
const session = await client.createCheckoutSession({ ... });
```

Used by Admin, Web, and Mobile — each app just configures the `baseUrl` and `getToken` differently.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **MongoDB** (local or Atlas)
- **Stripe account** (for payment features, optional)

### Installation

```bash
# Clone the repository
git clone <repo-url> fatsoma-clone
cd fatsoma-clone

# Install all dependencies (workspaces + Turborepo)
npm install
```

### Environment Setup

```bash
# Copy the API environment file and fill in your values
cp apps/api/.env.example apps/api/.env
```

Required variables in `apps/api/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/fatsoma-clone
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
WEB_URL=http://localhost:3001
STRIPE_SECRET_KEY=sk_test_...          # Optional
STRIPE_WEBHOOK_SECRET=whsec_...        # Optional
```

### Seed the Database (Optional)

```bash
npm run seed
```

### Run Everything

```bash
# Start all apps in parallel (API + Admin + Web)
npm run dev
```

Or start individually:

```bash
npm run dev:api       # API at http://localhost:4000
npm run dev:admin     # Admin at http://localhost:3000
npm run dev:web       # Web at http://localhost:3001
npm run dev:mobile    # Mobile at http://localhost:8081
```

For mobile specifically:

```bash
npm run android       # Launch on Android emulator
npm run ios           # Launch on iOS simulator (macOS only)
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API, Admin, and Web in parallel |
| `npm run dev:api` | Start only the API server |
| `npm run dev:admin` | Start only the Admin dashboard |
| `npm run dev:web` | Start only the Web app |
| `npm run dev:mobile` | Start Expo dev server |
| `npm run android` | Launch mobile on Android emulator |
| `npm run ios` | Launch mobile on iOS simulator |
| `npm run build` | Build all apps for production |
| `npm run lint` | Lint all apps |
| `npm run seed` | Seed the database with sample data |

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | API server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for signing access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Yes |
| `CORS_ORIGIN` | Comma-separated allowed origins | Yes |
| `WEB_URL` | Web app URL (for Stripe redirects) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | No |

### Web & Admin

Both Next.js apps read `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + npm workspaces |
| **API** | Express.js 5, Mongoose, JWT, Multer, Stripe |
| **Admin** | Next.js 16, React 19, Tailwind CSS v4, Lucide Icons |
| **Web** | Next.js 16, React 19, Tailwind CSS v4, Stripe.js |
| **Mobile** | Expo SDK 54, React Native 0.81, React Navigation |
| **Shared** | TypeScript 5, Zod |
| **Database** | MongoDB |
| **Payments** | Stripe Checkout + Webhooks |
| **Auth** | JWT (access + refresh tokens) |
| **Validation** | Zod (shared between API and clients) |

---

## License

Private project — not licensed for public distribution.
