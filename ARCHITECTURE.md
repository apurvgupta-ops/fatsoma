# On The List — Full System Architecture

> **Version:** 1.0.0  
> **Last Updated:** March 2026  
> **Stack:** TypeScript · Express 5 · Next.js 16 · React Native (Expo 54) · MongoDB · Stripe · Turborepo

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Dependency Graph](#3-dependency-graph)
4. [Shared Packages](#4-shared-packages)
5. [API Server (Express)](#5-api-server-express)
6. [Web Application (Next.js)](#6-web-application-nextjs)
7. [Admin Panel (Next.js)](#7-admin-panel-nextjs)
8. [Mobile Application (Expo / React Native)](#8-mobile-application-expo--react-native)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Payment Flow (Stripe)](#10-payment-flow-stripe)
11. [Resale Marketplace & Seller Payout](#11-resale-marketplace--seller-payout)
12. [Email Notification System](#12-email-notification-system)
13. [Database Schema (MongoDB)](#13-database-schema-mongodb)
14. [API Reference](#14-api-reference)
15. [Build & Deployment Pipeline](#15-build--deployment-pipeline)
16. [Environment Configuration](#16-environment-configuration)
17. [Security Considerations](#17-security-considerations)
18. [Error Handling Strategy](#18-error-handling-strategy)

---

## 1. High-Level Overview

On The List is a full-stack event ticketing platform with four client surfaces and a shared backend:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                    │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐    │
│  │ Web App  │   │Admin App │   │Mobile App│   │ Stripe Hosted│    │
│  │ (Next.js)│   │ (Next.js)│   │  (Expo)  │   │  Checkout    │    │
│  │ :3001    │   │ :3003    │   │          │   │              │    │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └──────┬───────┘    │
│       │              │              │                 │             │
│       └──────────────┴──────┬───────┴─────────────────┘             │
│                             │                                       │
│                    ┌────────▼────────┐                              │
│                    │  API Client     │                              │
│                    │ (@fatsoma/      │                              │
│                    │  api-client)    │                              │
│                    └────────┬────────┘                              │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┼───────────────────────────────────────┐
│                    ┌────────▼────────┐          BACKEND             │
│                    │  Express API    │                              │
│                    │  :3016          │                              │
│                    └───┬────────┬────┘                              │
│                        │        │                                   │
│              ┌─────────▼┐  ┌────▼──────┐                           │
│              │ MongoDB  │  │  Stripe   │                           │
│              │          │  │  API      │                           │
│              └──────────┘  └─────┬─────┘                           │
│                                  │                                  │
│                           ┌──────▼──────┐                          │
│                           │  Webhooks   │                          │
│                           │  (payment   │                          │
│                           │  events)    │                          │
│                           └─────────────┘                          │
│                                                                     │
│              ┌──────────┐                                          │
│              │  SMTP    │  (Nodemailer → email notifications)      │
│              └──────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Capabilities

| Capability              | Description                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| **Event Management**    | Create, edit, publish/unpublish events with ticket batches, venue info, and dynamic pricing |
| **Ticket Purchase**     | Stripe Checkout with automatic ticket generation and QR codes                               |
| **Resale Marketplace**  | Anti-scalping resale: sellers list at or below face value, buyers get fresh QR codes        |
| **Seller Payout**       | Automatic Stripe refund to seller's original payment method when resale completes           |
| **Admin Dashboard**     | Full CRUD for events, users, payments with stats and pagination                             |
| **Email Notifications** | Transactional emails for registration, booking, resale, password reset, account deletion    |
| **Multi-Platform Auth** | JWT access/refresh tokens with automatic refresh across web, admin, and mobile              |

---

## 2. Monorepo Structure

```
fatsoma-clone/
│
├── turbo.json                  # Turborepo pipeline configuration
├── tsconfig.base.json          # Shared TypeScript compiler options
├── package.json                # Root workspace definition
├── .npmrc                      # npm configuration
├── .env.local                  # Environment variables (not committed)
├── .gitignore
│
├── apps/
│   ├── api/                    # Express REST API server
│   │   ├── src/
│   │   │   ├── index.ts                    # Entry point — mounts routes, starts server
│   │   │   ├── controllers/                # Request handlers (thin layer)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── checkout.controller.ts
│   │   │   │   ├── event.controller.ts
│   │   │   │   ├── order.controller.ts
│   │   │   │   ├── resale.controller.ts
│   │   │   │   ├── ticket.controller.ts
│   │   │   │   ├── upload.controller.ts
│   │   │   │   └── user.controller.ts
│   │   │   ├── services/                   # Business logic layer
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── checkout.service.ts
│   │   │   │   ├── event.service.ts
│   │   │   │   ├── order.service.ts
│   │   │   │   ├── resale.service.ts
│   │   │   │   ├── ticket.service.ts
│   │   │   │   └── user.service.ts
│   │   │   ├── models/                     # Mongoose schemas
│   │   │   │   ├── Event.ts
│   │   │   │   ├── Order.ts
│   │   │   │   ├── ResaleListing.ts
│   │   │   │   ├── Ticket.ts
│   │   │   │   └── User.ts
│   │   │   ├── routes/                     # Express route definitions
│   │   │   │   ├── auth.ts
│   │   │   │   ├── checkout.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── resale.ts
│   │   │   │   ├── tickets.ts
│   │   │   │   ├── uploads.ts
│   │   │   │   └── users.ts
│   │   │   ├── middleware/                  # Express middleware
│   │   │   │   ├── auth.ts                 # JWT verification, role checks
│   │   │   │   ├── error.ts               # Global error handler
│   │   │   │   └── validate.ts            # Zod schema validation
│   │   │   ├── lib/                        # Infrastructure utilities
│   │   │   │   ├── db.ts                  # MongoDB connection
│   │   │   │   ├── jwt.ts                 # Token generation/verification
│   │   │   │   └── email.ts              # SMTP email sender
│   │   │   ├── utils/                      # Shared helpers
│   │   │   │   ├── AppError.ts            # Custom error class
│   │   │   │   ├── asyncHandler.ts        # Async middleware wrapper
│   │   │   │   ├── paramId.ts             # ObjectId param extraction
│   │   │   │   └── response.ts            # Standardized response helpers
│   │   │   └── scripts/
│   │   │       └── seed.ts                # Database seeding (admin user)
│   │   ├── uploads/                        # Uploaded images directory
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nodemon.json
│   │
│   ├── web/                    # Public-facing Next.js web application
│   │   ├── src/
│   │   │   ├── app/                        # Next.js App Router pages
│   │   │   │   ├── layout.tsx             # Root layout (fonts, AuthProvider)
│   │   │   │   ├── globals.css            # Tailwind v4 theme
│   │   │   │   ├── page.tsx               # Home page
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── events/page.tsx
│   │   │   │   ├── events/[id]/page.tsx
│   │   │   │   ├── tickets/page.tsx
│   │   │   │   ├── checkout/success/page.tsx
│   │   │   │   ├── how-it-works/page.tsx
│   │   │   │   ├── trust-safety/page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── help-centre/page.tsx
│   │   │   │   ├── contact/page.tsx
│   │   │   │   └── terms/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   ├── ExploreHeader.tsx
│   │   │   │   └── ExploreEventCard.tsx
│   │   │   ├── context/
│   │   │   │   └── AuthContext.tsx
│   │   │   └── lib/
│   │   │       └── api.ts
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/                  # Admin panel Next.js application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── providers.tsx
│   │   │   │   ├── globals.css
│   │   │   │   ├── page.tsx               # Root redirect
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── panel/page.tsx         # Fee overview
│   │   │   │   ├── events/page.tsx
│   │   │   │   ├── events/create/page.tsx
│   │   │   │   ├── events/[id]/edit/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   └── payments/page.tsx
│   │   │   ├── components/
│   │   │   │   ├── Logo.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── AuthenticatedLayout.tsx
│   │   │   │   └── events/
│   │   │   │       └── EventFormPrimitives.tsx
│   │   │   └── lib/
│   │   │       ├── api.ts
│   │   │       └── auth-context.tsx
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── mobile/                 # Expo React Native application
│       ├── App.tsx                         # Root component
│       ├── index.ts                        # registerRootComponent
│       ├── app.json                        # Expo configuration
│       ├── babel.config.js
│       ├── metro.config.js                 # Monorepo-aware Metro bundler
│       ├── src/
│       │   ├── navigation/
│       │   │   ├── RootNavigator.tsx      # Auth/Main stack switching
│       │   │   └── types.ts              # Navigation param types
│       │   ├── screens/
│       │   │   ├── ExploreScreen.tsx
│       │   │   ├── EventDetailScreen.tsx
│       │   │   ├── TicketsScreen.tsx
│       │   │   ├── ProfileScreen.tsx
│       │   │   ├── InfoScreen.tsx
│       │   │   ├── LoginScreen.tsx
│       │   │   └── SignupScreen.tsx
│       │   ├── components/
│       │   │   └── EventCard.tsx
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   ├── hooks/
│       │   │   └── useEvents.ts
│       │   ├── lib/
│       │   │   └── api.ts
│       │   └── theme/
│       │       ├── index.ts
│       │       ├── colors.ts
│       │       └── spacing.ts
│       ├── assets/
│       │   └── icon.png
│       ├── package.json
│       └── tsconfig.json
│
└── packages/
    ├── shared/                 # Shared types, schemas, constants
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── types.ts
    │   │   ├── schemas.ts
    │   │   └── constants.ts
    │   ├── package.json
    │   └── tsconfig.json
    │
    └── api-client/             # Typed HTTP client for the API
        ├── src/
        │   ├── index.ts
        │   └── client.ts
        ├── package.json
        └── tsconfig.json
```

---

## 3. Dependency Graph

```
                    ┌───────────────────┐
                    │  @fatsoma/shared  │  (types, schemas, constants)
                    │  Zero dependencies│
                    └─────────┬─────────┘
                              │
                    ┌─────────▼──────────┐
                    │ @fatsoma/api-client │  (FatsomaClient HTTP class)
                    │ depends on: shared  │
                    └──┬──────┬──────┬───┘
                       │      │      │
          ┌────────────▼┐  ┌──▼────┐ ┌▼────────────┐
          │ @fatsoma/web│  │admin  │ │  mobile     │
          │ Next.js 16  │  │Next.js│ │  Expo 54    │
          │ React 19    │  │React19│ │  React Native│
          │ Tailwind 4  │  │TW 4   │ │             │
          └─────────────┘  └───────┘ └─────────────┘

          ┌─────────────┐
          │ @fatsoma/api │  (Express 5 server)
          │ depends on:  │
          │  shared      │
          │  mongoose    │
          │  stripe      │
          │  nodemailer  │
          │  bcrypt      │
          │  jsonwebtoken│
          │  multer      │
          │  zod         │
          └─────────────┘
```

### Build Order (Turborepo)

```
1. @fatsoma/shared        →  tsc → dist/
2. @fatsoma/api-client    →  tsc → dist/  (depends on shared)
3. @fatsoma/api           →  tsc → dist/  (depends on shared)
   @fatsoma/web           →  next build   (depends on shared + api-client)
   @fatsoma/admin         →  next build   (depends on shared + api-client)
```

---

## 4. Shared Packages

### 4.1 `@fatsoma/shared`

Central type definitions and validation schemas shared across all apps.

#### Types (`types.ts`)

| Type                    | Purpose                         | Key Fields                                                                                                                                                                                       |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TicketBatch`           | Ticket tier definition          | `name`, `quantity`, `basePrice`, `minDiscount`, `maxDiscount`                                                                                                                                    |
| `EventBase`             | Core event fields               | `eventName`, `eventCategory`, `venueName`, `city`, `eventDate`, `ticketBatches`, `allowResale`, `platformCommission`                                                                             |
| `EventResponse`         | API event response              | EventBase + `id`, `status`, `createdBy`, timestamps                                                                                                                                              |
| `UserResponse`          | API user response               | `id`, `name`, `email`, `role`, `isActive`, timestamps                                                                                                                                            |
| `AuthTokens`            | JWT token pair                  | `accessToken`, `refreshToken`                                                                                                                                                                    |
| `LoginResponse`         | Auth response                   | `user: UserResponse`, `tokens: AuthTokens`                                                                                                                                                       |
| `ApiResponse<T>`        | Standard API envelope           | `ok`, `message`, `data?`                                                                                                                                                                         |
| `TicketResponse`        | Full ticket with event context  | `id`, `orderId`, `eventId`, `userId`, `eventName`, `ticketBatchName`, `purchasePrice`, `originalPrice`, `status`, `qrCode`, `allowResale`, `currentBatchPrice`, `eventDate`, `venueName`, `city` |
| `ResaleListingResponse` | Resale listing with payout info | `id`, `ticketId`, `eventId`, `sellerId`, `askingPrice`, `originalPurchasePrice`, `status`, `sellerPayout`, `sellerRefundId`, `sellerRefundStatus`                                                |

#### Validation Schemas (`schemas.ts` — Zod)

| Schema              | Validates           | Key Rules                                                                                                  |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ticketBatchSchema` | Ticket batch input  | `name` min 1, `quantity ≥ 0`, `basePrice ≥ 0`, `minDiscount ≤ maxDiscount` (0–100)                         |
| `createEventSchema` | Event creation      | `eventName` 1–200 chars, `eventDescription` 1–5000, category enum, min 1 batch, `platformCommission` 0–100 |
| `loginSchema`       | Login input         | Valid email, password min 6                                                                                |
| `registerSchema`    | Registration        | Name 2–100, valid email, password min 6                                                                    |
| `createUserSchema`  | Admin user creation | Name 2–100, valid email, password min 6, role enum                                                         |

#### Constants (`constants.ts`)

| Constant              | Value                                                                    | Usage                                            |
| --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------ |
| `BOOKING_FEE_PERCENT` | `10`                                                                     | Applied to every ticket purchase as platform fee |
| `EVENT_CATEGORIES`    | `["Party", "Club Night", "Concert", "Festival", "Pop-Up", "Conference"]` | Event category enum                              |
| `USER_ROLES`          | `["admin", "user"]`                                                      | User role enum                                   |
| `EVENT_STATUSES`      | `["draft", "published"]`                                                 | Event lifecycle states                           |

### 4.2 `@fatsoma/api-client`

Typed HTTP client (`FatsomaClient`) used by all frontend applications.

#### Constructor Configuration

```typescript
interface ClientConfig {
  baseUrl: string;
  getToken?: () => string | null;           // Returns current access token
  getRefreshToken?: () => string | null;    // Returns current refresh token
  onTokenRefreshed?: (access: string, refresh: string) => void;  // Store new tokens
  onAuthFailure?: () => void;               // Logout callback on permanent auth failure
}
```

#### Automatic Token Refresh

The client implements transparent token refresh:

```
Request with expired token
        │
        ▼
   401 Unauthorized
        │
        ▼
  Is this a retry? ──Yes──▶ Call onAuthFailure() → logout
        │
       No
        │
        ▼
  tryRefresh()
        │
        ├── Concurrent refresh? → Reuse existing refreshPromise
        │
        ├── POST /api/auth/refresh { refreshToken }
        │       │
        │       ├── Success → onTokenRefreshed(newAccess, newRefresh)
        │       │              → Retry original request
        │       │
        │       └── Failure → onAuthFailure() → logout
        │
        └── No refresh token → onAuthFailure() → logout
```

#### Complete Method Reference

| Category     | Method                              | HTTP   | Endpoint                                   |
| ------------ | ----------------------------------- | ------ | ------------------------------------------ |
| **Auth**     | `register(input)`                   | POST   | `/api/auth/register`                       |
|              | `login(input)`                      | POST   | `/api/auth/login`                          |
|              | `refreshToken(token)`               | POST   | `/api/auth/refresh`                        |
|              | `getMe()`                           | GET    | `/api/auth/me`                             |
|              | `forgotPassword(email)`             | POST   | `/api/auth/forgot-password`                |
|              | `resetPassword(token, password)`    | POST   | `/api/auth/reset-password`                 |
| **Events**   | `getPublishedEvents()`              | GET    | `/api/events/published`                    |
|              | `getEvents()`                       | GET    | `/api/events`                              |
|              | `getEvent(id)`                      | GET    | `/api/events/:id`                          |
|              | `createEvent(input)`                | POST   | `/api/events`                              |
|              | `updateEvent(id, input)`            | PUT    | `/api/events/:id`                          |
|              | `updateEventStatus(id, status)`     | PATCH  | `/api/events/:id/status`                   |
|              | `deleteEvent(id)`                   | DELETE | `/api/events/:id`                          |
| **Users**    | `getUsers()`                        | GET    | `/api/users`                               |
|              | `createUser(input)`                 | POST   | `/api/users`                               |
|              | `updateUserStatus(id, isActive)`    | PATCH  | `/api/users/:id/status`                    |
|              | `updateUserRole(id, role)`          | PATCH  | `/api/users/:id/role`                      |
|              | `deleteUser(id)`                    | DELETE | `/api/users/:id`                           |
| **Checkout** | `createCheckoutSession(input)`      | POST   | `/api/checkout/create-session`             |
|              | `getCheckoutSession(sessionId)`     | GET    | `/api/checkout/session/:sessionId`         |
|              | `confirmCheckoutSession(sessionId)` | POST   | `/api/checkout/session/:sessionId/confirm` |
| **Tickets**  | `getMyTickets()`                    | GET    | `/api/tickets/my`                          |
|              | `getTicket(id)`                     | GET    | `/api/tickets/:id`                         |
| **Resale**   | `listTicketForResale(input)`        | POST   | `/api/resale/list`                         |
|              | `cancelResaleListing(id)`           | DELETE | `/api/resale/:id`                          |
|              | `getMyResaleListings()`             | GET    | `/api/resale/my`                           |
|              | `getResaleListings(eventId)`        | GET    | `/api/resale/event/:eventId`               |
|              | `buyResaleTicket(listingId, fee)`   | POST   | `/api/resale/:id/buy`                      |
| **Orders**   | `getMyOrders()`                     | GET    | `/api/orders/my`                           |
|              | `getOrders(params)`                 | GET    | `/api/orders`                              |
|              | `getOrderStats()`                   | GET    | `/api/orders/stats`                        |
| **Upload**   | `uploadImage(file)`                 | POST   | `/api/uploads`                             |

---

## 5. API Server (Express)

### 5.1 Architecture Pattern

```
HTTP Request
    │
    ▼
┌─────────────────┐
│   Express Router │  (routes/*.ts — route definitions + middleware chain)
└────────┬────────┘
         │
┌────────▼────────┐
│   Middleware     │  auth.ts → authenticate, requireAdmin
│                  │  validate.ts → Zod schema validation
└────────┬────────┘
         │
┌────────▼────────┐
│   Controller    │  (controllers/*.ts — extract params, call service, send response)
└────────┬────────┘
         │
┌────────▼────────┐
│   Service       │  (services/*.ts — business logic, DB queries, external APIs)
└────────┬────────┘
         │
┌────────▼────────┐
│   Model         │  (models/*.ts — Mongoose schemas, validation, hooks)
└────────┬────────┘
         │
┌────────▼────────┐
│   MongoDB       │
└─────────────────┘
```

### 5.2 Entry Point (`index.ts`)

Startup sequence:

1. Load `.env.local` then `.env` via `dotenv`
2. Configure CORS with origins from `CORS_ORIGIN` env var
3. Mount raw body parser for `/api/checkout/webhook` (Stripe signature verification)
4. Mount JSON body parser (10MB limit)
5. Serve static files from `/uploads`
6. Mount all route modules under `/api/*`
7. Register health check at `GET /api/health`
8. Register global error handler
9. Connect to MongoDB
10. Start listening on `PORT` (default 3016)

### 5.3 Middleware

#### Authentication (`middleware/auth.ts`)

| Export         | Purpose                                                                                             | Response on Failure |
| -------------- | --------------------------------------------------------------------------------------------------- | ------------------- |
| `authenticate` | Extracts Bearer token from `Authorization` header, verifies JWT, sets `req.user = { userId, role }` | 401 Unauthorized    |
| `requireAdmin` | Checks `req.user.role === "admin"`                                                                  | 403 Forbidden       |

#### Validation (`middleware/validate.ts`)

```typescript
validate(schema: ZodSchema) → middleware
```

Validates `req.body` against a Zod schema. Returns 400 with structured field-level errors on failure.

#### Error Handler (`middleware/error.ts`)

Global error handler that maps error types to HTTP responses:

| Error Type                    | Status Code      | Behavior                              |
| ----------------------------- | ---------------- | ------------------------------------- |
| `AppError`                    | Custom (400–500) | Returns `{ ok: false, message }`      |
| `ZodError`                    | 400              | Returns field-level validation errors |
| `mongoose.ValidationError`    | 400              | Extracts field messages               |
| `mongoose.CastError`          | 400              | "Invalid ID format"                   |
| MongoDB duplicate key (11000) | 409              | "Duplicate value"                     |
| Multer file too large         | 413              | "File too large"                      |
| Unknown                       | 500              | "Internal server error" (no leak)     |

### 5.4 Services — Detailed Business Logic

#### `auth.service.ts`

| Function                              | Logic                                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `registerUser(name, email, password)` | Check duplicate email → bcrypt hash (10 rounds) → create User → generate tokens → send welcome email → return user + tokens             |
| `loginUser(email, password)`          | Find user by email → check `isActive` → bcrypt compare → generate tokens → return user + tokens                                         |
| `refreshAccessToken(token)`           | Verify refresh JWT → find user → check `isActive` → generate new access token                                                           |
| `getCurrentUser(userId)`              | Find user → check `isActive` → return user (exclude password)                                                                           |
| `forgotPassword(email)`               | Find user → generate `crypto.randomBytes(32)` hex token → set `resetPasswordToken` + `resetPasswordExpires` (1 hour) → send reset email |
| `resetPassword(token, newPassword)`   | Find user by token where `expires > now` → bcrypt hash → clear reset fields → save                                                      |

#### `checkout.service.ts`

This is the most complex service. It handles the full payment lifecycle.

**Primary Checkout Flow:**

```
createCheckoutSession(eventId, batchName, quantity, capturedFee, userId)
    │
    ├── Validate: event exists, is published
    ├── Validate: batch exists
    ├── Check remaining tickets (Ticket.countDocuments where status ≠ cancelled)
    ├── Calculate: unitTotal = basePrice + fee; totalAmount = unitTotal × quantity
    │
    └── stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{ price_data, quantity }],
            metadata: { type: "primary", eventId, batchName, quantity, basePrice,
                        capturedFee, totalAmount, eventName, userId },
            success_url: WEB_URL/checkout/success?session_id={CHECKOUT_SESSION_ID},
            cancel_url: WEB_URL/events/{eventId}
        })
```

**Resale Checkout Flow:**

```
createResaleCheckoutSession(listingId, capturedFee, userId)
    │
    ├── Validate: listing exists, is active
    ├── Validate: buyer ≠ seller
    ├── Validate: ticket exists, status is "listed"
    │
    └── stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [{ price_data: askingPrice + fee }],
            metadata: { type: "resale", listingId, eventId, ticketId,
                        eventName, ticketBatchName, basePrice, capturedFee, userId }
        })
```

**Payment Confirmation (dual path):**

Payment is confirmed via two independent paths for reliability:

```
Path 1: Client-side polling (confirmSession)
    Browser redirects to /checkout/success?session_id=...
    → POST /api/checkout/session/:id/confirm
    → Retrieves Stripe session, checks payment_status

Path 2: Stripe Webhook (handleWebhookEvent)
    Stripe sends checkout.session.completed event
    → POST /api/checkout/webhook
    → Verifies signature, processes event

Both paths call the same idempotent logic:
    findOrCreateOrderFromSession(session, "paid")
    → If primary: generateTickets(order)
    → If resale: completeResaleTransfer(order)
```

**Ticket Generation:**

```
generateTickets(order)
    │
    ├── Check: no existing tickets for this order (idempotent)
    │
    └── For each ticket (1..quantity):
            Create Ticket {
                orderId, eventId, userId, eventName, ticketBatchName,
                purchasePrice: basePrice,
                originalPrice: basePrice,
                stripePaymentIntentId: order.stripePaymentIntentId,
                status: "active",
                qrCode: crypto.randomUUID()
            }
```

**Resale Transfer (with seller payout):**

```
completeResaleTransfer(order)
    │
    ├── Find listing → check not already "sold"
    ├── Find ticket
    │
    ├── Calculate:
    │     sellerPayout = originalPurchasePrice
    │     organiserRevenue = askingPrice - originalPurchasePrice
    │
    ├── Update listing:
    │     status → "sold", buyerId, resaleOrderId, platformFee, sellerPayout, organiserRevenue
    │
    ├── Transfer ticket:
    │     userId → buyer, purchasePrice → askingPrice, status → "active", new qrCode
    │
    ├── issueSellerRefund(listing, ticket.stripePaymentIntentId, sellerPayout)
    │     └── stripe.refunds.create({ payment_intent, amount, reason: "requested_by_customer" })
    │     └── Store refundId + refundStatus on listing
    │
    └── notifySellerOfSale(listing, order)
          └── Find seller User → sendTicketSoldEmail()
```

#### `event.service.ts`

| Function                        | Logic                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `getPublishedEvents()`          | `Event.find({ status: "published" }).sort({ eventDate: 1 })` + sold counts per batch |
| `getAllEvents(userId, role)`    | Admin: all events; User: `{ createdBy: userId }`                                     |
| `getEventById(id)`              | `Event.findById(id)` + sold counts                                                   |
| `createEvent(input, userId)`    | Set `bookingFee: BOOKING_FEE_PERCENT`, `createdBy: userId` → `Event.create()`        |
| `updateEvent(id, input)`        | `Event.findByIdAndUpdate(id, input, { new: true })`                                  |
| `updateEventStatus(id, status)` | Set `status` to "draft" or "published"                                               |
| `deleteEvent(id)`               | `Event.findByIdAndDelete(id)`                                                        |

**Sold counts helper:** Aggregates `Ticket.aggregate([{ $match: { eventId, status: { $ne: "cancelled" } } }, { $group: { _id: "$ticketBatchName", count: { $sum: 1 } } }])` to compute `remaining` per batch.

#### `order.service.ts`

| Function              | Logic                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listOrders(filters)` | Filter by `status`, `type`, `eventId`; search across `eventName`, `customerEmail`, `customerName`, `stripeSessionId`, and partial `_id` match using `$expr + $regexMatch` |
| `getMyOrders(userId)` | `Order.find({ userId }).sort({ createdAt: -1 })`                                                                                                                          |
| `getOrderStats()`     | Aggregate: total/paid/pending counts, gross revenue, resale stats from `ResaleListing.find({ status: "sold" })`                                                           |

#### `resale.service.ts`

| Function                           | Logic                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `listForResale(input)`             | Validate ownership → check `event.allowResale` → enforce `askingPrice ≤ batch.basePrice` → set ticket status to "listed" → create ResaleListing |
| `cancelListing(listingId, userId)` | Validate ownership → set listing "cancelled" → set ticket back to "active"                                                                      |
| `getMyListings(userId)`            | All listings for seller, sorted by `updatedAt` desc                                                                                             |
| `getListingsForEvent(eventId)`     | Active listings sorted by `askingPrice` asc                                                                                                     |

#### `ticket.service.ts`

| Function                          | Logic                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `getMyTickets(userId)`            | Fetch tickets → enrich with event data (allowResale, currentBatchPrice, eventDate, venueName, city) |
| `getTicketById(ticketId, userId)` | Fetch + enforce ownership                                                                           |

#### `user.service.ts`

| Function                                  | Logic                                                       |
| ----------------------------------------- | ----------------------------------------------------------- |
| `listUsers()`                             | All users sorted by `createdAt` desc                        |
| `createUser(name, email, password, role)` | Check duplicate → bcrypt hash → create                      |
| `updateUserStatus(id, isActive)`          | Toggle active/inactive                                      |
| `updateUserRole(id, role)`                | Change admin/user role                                      |
| `deleteUser(id, requestingUserId)`        | Prevent self-deletion → delete → send account-deleted email |

### 5.5 Utility Classes

#### `AppError`

Custom error class with static factory methods:

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  static badRequest(msg)    → 400
  static unauthorized(msg)  → 401
  static forbidden(msg)     → 403
  static notFound(msg)      → 404
  static conflict(msg)      → 409
}
```

#### Response Helpers

```typescript
sendSuccess(res, data, message, statusCode = 200)
  → { ok: true, message, data }

sendMessage(res, message, statusCode = 200)
  → { ok: true, message }
```

---

## 6. Web Application (Next.js)

### 6.1 Tech Stack

| Technology   | Version | Purpose                                        |
| ------------ | ------- | ---------------------------------------------- |
| Next.js      | 16.1.6  | React framework with App Router                |
| React        | 19.2.3  | UI library                                     |
| Tailwind CSS | 4.x     | Utility-first CSS (via `@tailwindcss/postcss`) |
| Lucide React | 0.574.0 | Icon library                                   |
| Stripe.js    | 8.8.0   | Client-side Stripe integration                 |

### 6.2 Theme

Dark luxury aesthetic with gold accents:

| Variable       | Value     | Usage                  |
| -------------- | --------- | ---------------------- |
| `--void`       | `#0a0a0a` | Deepest background     |
| `--surface`    | `#141414` | Card/panel backgrounds |
| `--border`     | `#1f1f1f` | Subtle borders         |
| `--gold`       | `#d4a843` | Primary accent, CTAs   |
| `--gold-light` | `#e8c36a` | Hover states           |
| `--cream`      | `#f0e6d2` | Primary text           |

Fonts: **Space Grotesk** (body), **IBM Plex Mono** (monospace), **Cormorant Garamond** (serif headings).

### 6.3 Page Map & User Flows

```
                    ┌──────────┐
                    │  Home /  │
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
    │  /events  │  │/tickets │  │  /profile  │
    └─────┬─────┘  └────┬────┘  └────────────┘
          │              │
    ┌─────▼──────┐  Tabs: Active │ Resale │ Sold │ History
    │/events/[id]│       │
    └─────┬──────┘  List for resale / Cancel listing / View QR
          │
    Buy Now → Stripe Checkout
          │
    ┌─────▼──────────────┐
    │/checkout/success   │
    └────────────────────┘

    Auth:  /login ↔ /signup ↔ /forgot-password → /reset-password
    Info:  /how-it-works, /trust-safety, /pricing, /help-centre, /contact, /terms
```

### 6.4 Key Pages — Detailed

#### Home (`/`)
- Hero section with "Browse Events" and "My Tickets" CTAs
- "How It Works" section (3 feature cards)
- Featured Events (top 3 published events)
- "List a Ticket" CTA section
- Scroll indicator that scrolls to "How It Works"

#### Events (`/events`)
- Search bar (searches event name, venue, description)
- Category filter pills (All, Party, Club Night, Concert, Festival, Pop-Up, Conference)
- Week-based date selector with prev/next navigation
- Event cards with image, category badge, resale badge, sold-out indicator, venue, date, price

#### Event Detail (`/events/[id]`)
- Hero image with event info overlay
- Event description
- Venue card with address and Google Maps link
- **Ticket Purchase Panel:**
  - Batch selector (radio buttons per ticket tier)
  - Quantity selector (+/- with remaining count)
  - Price breakdown: base price + 10% booking fee × quantity
  - "Buy Now" button → creates Stripe checkout session → redirects
  - Sold-out handling: disables quantity buttons
- **Resale Listings Section:**
  - Lists active resale tickets sorted by price
  - Each listing shows asking price + booking fee
  - "Buy" button → creates resale checkout session → redirects

#### My Tickets (`/tickets`)
- **Active tab:** Valid tickets with QR codes, "List for Resale" button
- **Resale tab:** Listed tickets with "Cancel Listing" button (with confirmation modal)
- **Sold tab:** Sold resale listings with payout breakdown and refund status
- **History tab:** Transferred, used, or cancelled tickets
- QR code modal: Click QR to see enlarged version
- Resale modal: Set asking price (max = current batch price)

#### Profile (`/profile`)
- User details (name, email, role, join date)
- Stats cards (total orders, total spent, account status)
- Purchase history with pagination (10 per page)

### 6.5 Auth Context

```typescript
AuthContext provides:
  user: UserResponse | null
  loading: boolean
  login(email, password): Promise<void>
  register(input): Promise<void>
  logout(): void
```

**Initialization:** On mount, reads `accessToken` from localStorage → calls `getMe()` → sets user or clears tokens.

**Login/Signup restriction:** Both `/login` and `/signup` pages redirect authenticated users away using `router.replace()`. After successful auth, `router.replace(redirectTo)` prevents back-button navigation to auth pages.

**Deactivated user handling:** If the API returns 403 (user deactivated), the auth failure callback triggers automatic logout.

---

## 7. Admin Panel (Next.js)

### 7.1 Layout

Sidebar navigation with authenticated layout wrapper:

```
┌──────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────┐ │
│ │          │ │                             │ │
│ │ Sidebar  │ │     Main Content Area       │ │
│ │          │ │                             │ │
│ │ Dashboard│ │                             │ │
│ │ Events   │ │                             │ │
│ │ Payments │ │                             │ │
│ │ Panel    │ │                             │ │
│ │ Users    │ │                             │ │
│ │          │ │                             │ │
│ │ Sign Out │ │                             │ │
│ └──────────┘ └─────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 7.2 Page Map

#### Dashboard (`/dashboard`)
- Stat cards: Total Events, Published Events, Draft Events, Gross Revenue
- Each stat card is a clickable link to its respective page
- Recent events list with status badges

#### Events (`/events`)
- Event grid with status badges (Published/Draft)
- "Create Event" button → `/events/create`
- Click event → `/events/[id]/edit`

#### Create Event (`/events/create`)
- Multi-section form: Details, Image Upload, Venue, Ticket Batches, Platform Settings
- Ticket batch management: Add/remove batches with name, quantity, price, discount range
- Image upload via API (`/api/uploads`)
- Save as Draft or Publish

#### Edit Event (`/events/[id]/edit`)
- Same form as create, pre-filled with existing data
- Additional actions: Unpublish (for published events), Delete (with confirmation)

#### Users (`/users`)
- User table: Name, Email, Role, Status, Actions
- Actions: Change role (admin/user dropdown), Activate/Deactivate toggle, Delete

#### Payments (`/payments`)
- Stats: Total Orders, Paid Orders, Pending, Gross Revenue, Resale Orders, Resale Revenue
- Filters: Status (all/paid/pending/failed/expired), Type (all/primary/resale), Search
- Search works across: event name, customer email, customer name, Stripe session ID, order ID
- Paginated table (10 per page) with order details and Stripe dashboard links

#### Panel (`/panel`)
- Fee overview: Platform commission breakdown per event
- Summary cards: Total events, average fee, total projected revenue
- Filter: All/Published/Draft

---

## 8. Mobile Application (Expo / React Native)

### 8.1 Navigation Architecture

```
RootNavigator
    │
    ├── (Not authenticated) → AuthNavigator (Stack)
    │       ├── LoginScreen
    │       └── SignupScreen
    │
    └── (Authenticated) → MainNavigator (Stack)
            ├── HomeTabs (Bottom Tab Navigator)
            │       ├── ExploreTab → ExploreScreen
            │       ├── TicketsTab → TicketsScreen
            │       └── ProfileTab → ProfileScreen
            ├── EventDetail → EventDetailScreen
            └── InfoPage → InfoScreen
```

### 8.2 Screens

| Screen                | Features                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **ExploreScreen**     | Hero section, search bar, category filter pills, event list (FlatList), footer links to info pages                    |
| **EventDetailScreen** | Event hero, batch selector, quantity picker, price breakdown, Buy Now (opens Stripe URL in browser), resale section   |
| **TicketsScreen**     | Ticket list with QR codes, list for resale modal, cancel listing                                                      |
| **ProfileScreen**     | User info, logout with confirmation                                                                                   |
| **LoginScreen**       | Email/password form with show/hide toggle                                                                             |
| **SignupScreen**      | Name/email/password/confirm form with validation                                                                      |
| **InfoScreen**        | Dynamic content based on `pageId`: How It Works, Trust & Safety, Pricing, Help Centre (FAQ accordion), Contact, Terms |

### 8.3 Token Storage

Mobile uses `expo-secure-store` for token persistence:

```typescript
SecureStore.setItemAsync("accessToken", token)
SecureStore.setItemAsync("refreshToken", token)
SecureStore.getItemAsync("accessToken")
SecureStore.deleteItemAsync("accessToken")
```

### 8.4 Theme System

```typescript
colors = {
  bg: { primary: "#0A0A0A", secondary: "#0f0f0f", card: "#141414", surface: "#1a1a1a" },
  gold: { DEFAULT: "#d4a843", light: "#e8c36a", dim: "#8b7635", border: "#d4a84330" },
  cream: "#f0e6d2",
  text: { primary: "#f0e6d2", secondary: "#b8a88a", muted: "#8b8172", dim: "#5c5549" },
  status: { success: "#4ade80", error: "#ef4444", warning: "#f59e0b" }
}

spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }
radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 }
```

---

## 9. Authentication & Authorization

### 9.1 Token Architecture

```
┌─────────────────────────────────────────────────┐
│                  JWT Tokens                      │
│                                                  │
│  Access Token                                    │
│  ├── Payload: { userId, role }                   │
│  ├── Expiry: 2 hours                            │
│  ├── Algorithm: HS256                            │
│  └── Used in: Authorization: Bearer <token>      │
│                                                  │
│  Refresh Token                                   │
│  ├── Payload: { userId, role }                   │
│  ├── Expiry: 7 days                             │
│  ├── Algorithm: HS256                            │
│  └── Used in: POST /api/auth/refresh body        │
└─────────────────────────────────────────────────┘
```

### 9.2 Token Storage by Platform

| Platform | Access Token                        | Refresh Token                        |
| -------- | ----------------------------------- | ------------------------------------ |
| Web      | `localStorage.accessToken`          | `localStorage.refreshToken`          |
| Admin    | `localStorage.fatsoma_access_token` | `localStorage.fatsoma_refresh_token` |
| Mobile   | `SecureStore.accessToken`           | `SecureStore.refreshToken`           |

### 9.3 Auth Flow

```
Registration:
  Client → POST /api/auth/register { name, email, password }
  Server → Hash password → Create user → Generate tokens → Send welcome email
  Server → { user, tokens: { accessToken, refreshToken } }
  Client → Store tokens → Set user state

Login:
  Client → POST /api/auth/login { email, password }
  Server → Find user → Check isActive → Compare password → Generate tokens
  Server → { user, tokens }
  Client → Store tokens → Set user state

Session Restoration:
  Client → Read stored accessToken
  Client → GET /api/auth/me (Authorization: Bearer <accessToken>)
  Server → Verify JWT → Find user → Check isActive
  Server → { user }
  Client → Set user state (or clear tokens on failure)

Password Reset:
  Client → POST /api/auth/forgot-password { email }
  Server → Generate crypto token → Store on user → Send email with link
  Client → User clicks link → /reset-password?token=xxx
  Client → POST /api/auth/reset-password { token, password }
  Server → Validate token + expiry → Hash new password → Clear reset fields
```

### 9.4 Deactivated User Handling

When an admin deactivates a user:
1. `auth.service.getCurrentUser()` throws `AppError.forbidden("Account is deactivated")`
2. `auth.service.refreshAccessToken()` throws `AppError.forbidden("Account is deactivated")`
3. The API client's `onAuthFailure` callback triggers → user is logged out
4. This works across all platforms (web, admin, mobile)

---

## 10. Payment Flow (Stripe)

### 10.1 Primary Ticket Purchase

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │     │   API    │     │  Stripe  │     │  MongoDB │
└─────┬────┘     └─────┬────┘     └─────┬────┘     └─────┬────┘
      │                │                │                │
      │ POST /checkout │                │                │
      │ create-session │                │                │
      │───────────────▶│                │                │
      │                │                │                │
      │                │ Validate event │                │
      │                │ Check remaining│───────────────▶│
      │                │◀───────────────│                │
      │                │                │                │
      │                │ sessions.create│                │
      │                │───────────────▶│                │
      │                │                │                │
      │                │◀── session.url │                │
      │◀── { url }─────│                │                │
      │                │                │                │
      │ Redirect to    │                │                │
      │ Stripe Checkout│───────────────▶│                │
      │                │                │                │
      │                │    (user pays) │                │
      │                │                │                │
      │◀── redirect to │                │                │
      │ /checkout/     │                │                │
      │ success        │                │                │
      │                │                │                │
      │ POST /confirm  │                │                │
      │───────────────▶│                │                │
      │                │ retrieve       │                │
      │                │ session────────▶                │
      │                │◀───────────────│                │
      │                │                │                │
      │                │ Create Order   │                │
      │                │ Generate Tickets───────────────▶│
      │                │ Send Email     │                │
      │                │                │                │
      │◀── order ──────│                │                │
      │                │                │                │

      PARALLEL PATH (Webhook):
                       │◀── checkout.   │                │
                       │    session.     │                │
                       │    completed    │                │
                       │                │                │
                       │ Same idempotent│                │
                       │ logic as above │───────────────▶│
```

### 10.2 Price Calculation

```
Base Price (per ticket)    = batch.basePrice
Booking Fee (per ticket)   = basePrice × (BOOKING_FEE_PERCENT / 100)  [10%]
Unit Total                 = basePrice + bookingFee
Total Amount               = unitTotal × quantity

Example:
  Base Price: £50.00
  Booking Fee: £5.00 (10%)
  Quantity: 2
  Total: (£50 + £5) × 2 = £110.00
```

### 10.3 Stripe Configuration

- **Mode:** `payment` (one-time charges)
- **Currency:** GBP
- **Payment Methods:** Automatic (Stripe determines available methods based on customer's device/browser — includes Card, Apple Pay, Google Pay)
- **Metadata:** All order details stored in session metadata for webhook processing
- **Success URL:** `{WEB_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- **Cancel URL:** `{WEB_URL}/events/{eventId}`

---

## 11. Resale Marketplace & Seller Payout

### 11.1 Anti-Scalping Rules

| Rule                              | Enforcement                     |
| --------------------------------- | ------------------------------- |
| Resale must be enabled per event  | `event.allowResale === true`    |
| Price cannot exceed face value    | `askingPrice ≤ batch.basePrice` |
| Price must be positive            | `askingPrice > 0`               |
| Only ticket owner can list        | `ticket.userId === sellerId`    |
| Only active tickets can be listed | `ticket.status === "active"`    |
| Cannot buy own listing            | `listing.sellerId !== buyerId`  |

### 11.2 Resale Lifecycle

```
Ticket Status:    active ──▶ listed ──▶ active (new owner)
                              │
                              ├── cancelled (seller cancels) → active (returned)
                              └── expired (checkout expires) → active (returned)

Listing Status:   active ──▶ sold
                              │
                              ├── cancelled
                              └── expired
```

### 11.3 Revenue Split on Resale

```
Buyer pays:     askingPrice + bookingFee (10%)
                    │
                    ├── sellerPayout = originalPurchasePrice
                    │   (refunded to seller's original payment method)
                    │
                    ├── organiserRevenue = askingPrice - originalPurchasePrice
                    │   (profit from price difference stays with platform)
                    │
                    └── platformFee = bookingFee
                        (10% booking fee stays with platform)

Example:
  Original purchase: £50.00
  Resale asking price: £45.00
  Booking fee: £4.50 (10% of £45)

  Buyer pays: £49.50
  Seller receives: £50.00 (refund of original purchase price)
  Organiser revenue: -£5.00 (asking < original, so negative/zero)
  Platform fee: £4.50
```

### 11.4 Seller Payout Mechanism

When a resale ticket is purchased:

1. **Stripe Refund** is issued to the seller's original payment:
   ```
   stripe.refunds.create({
     payment_intent: ticket.stripePaymentIntentId,
     amount: sellerPayout × 100,  // in pence
     reason: "requested_by_customer",
     metadata: { type: "resale_seller_payout", listingId, sellerId }
   })
   ```

2. **Refund status** is tracked on the ResaleListing:
   - `sellerRefundId` — Stripe refund ID
   - `sellerRefundStatus` — `"succeeded"` | `"pending"` | `"failed"`

3. **Seller notification email** is sent with payout details

4. **Seller can track** payout status in the "Sold" tab on My Tickets page

### 11.5 QR Code Security

When a ticket is transferred via resale:
- The old QR code is **invalidated** (overwritten)
- A new `crypto.randomUUID()` QR code is generated for the buyer
- This prevents the seller from using a screenshot of the old QR code

---

## 12. Email Notification System

### 12.1 Architecture

```
Service Layer
    │
    └── import { sendXxxEmail } from "../lib/email"
            │
            ▼
        email.ts
            │
            ├── nodemailer.createTransport({ SMTP config })
            │
            ├── baseHtml(body) → branded HTML template
            │
            └── send(to, subject, html) → fire-and-forget
                    │
                    ├── Success → console.log
                    └── Failure → console.error (never throws)
```

### 12.2 Email Types

| Email                    | Trigger                   | Recipient    | Content                                              |
| ------------------------ | ------------------------- | ------------ | ---------------------------------------------------- |
| **Welcome**              | User registration         | New user     | Welcome message + "Browse Events" CTA                |
| **Booking Confirmation** | Primary ticket purchase   | Buyer        | Event name, ticket type, quantity, total, order ID   |
| **Resale Booking**       | Resale ticket purchase    | Buyer        | Event name, ticket type, total, order ID             |
| **Ticket Sold**          | Resale purchase completes | Seller       | Event name, sale price, payout amount, refund notice |
| **Account Deleted**      | Admin deletes user        | Deleted user | Notification + contact support                       |
| **Password Reset**       | Forgot password request   | User         | Reset link (1-hour expiry)                           |

### 12.3 Design

All emails use a consistent dark-themed HTML template:
- Background: `#0f0f0f`
- Card: `#1a1a1a` with `#2a2a2a` border
- Brand color: `#d4a843` (gold)
- Success color: `#4ade80` (green, for payouts)
- Max width: 560px, responsive

---

## 13. Database Schema (MongoDB)

### 13.1 Entity Relationship Diagram

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│   User   │       │  Event   │       │  Order   │
│──────────│       │──────────│       │──────────│
│ _id      │◀──┐   │ _id      │◀──┐   │ _id      │
│ name     │   │   │ eventName│   │   │ eventId  │──▶ Event
│ email    │   │   │ category │   │   │ userId   │──▶ User
│ password │   │   │ venue*   │   │   │ eventName│
│ role     │   │   │ eventDate│   │   │ batchName│
│ isActive │   │   │ batches[]│   │   │ quantity │
│ resetTkn │   │   │ allowRes │   │   │ basePrice│
│ resetExp │   │   │ status   │   │   │ fee      │
└──────────┘   │   │ createdBy│──▶│   │ total    │
               │   └──────────┘   │   │ stripeId │
               │                  │   │ type     │
               │                  │   │ status   │
               │                  │   │ resaleId │──┐
               │                  │   └──────────┘  │
               │                  │                  │
               │   ┌──────────┐   │   ┌─────────────▼┐
               │   │  Ticket  │   │   │ResaleListing │
               │   │──────────│   │   │──────────────│
               │   │ _id      │   │   │ _id          │
               ├───│ userId   │   │   │ ticketId     │──▶ Ticket
               │   │ orderId  │──▶│   │ eventId      │──▶ Event
               │   │ eventId  │──▶│   │ sellerId     │──▶ User
               │   │ eventName│       │ buyerId      │──▶ User
               │   │ batchName│       │ askingPrice  │
               │   │ price    │       │ originalPrice│
               │   │ origPrice│       │ status       │
               │   │ stripePi │       │ sellerPayout │
               │   │ status   │       │ refundId     │
               │   │ qrCode   │       │ refundStatus │
               │   └──────────┘       └──────────────┘
```

### 13.2 Model Details

#### User

| Field                  | Type    | Constraints                              | Index                          |
| ---------------------- | ------- | ---------------------------------------- | ------------------------------ |
| `name`                 | String  | Required, 2–100 chars, trimmed           | —                              |
| `email`                | String  | Required, unique, lowercase, email regex | unique                         |
| `password`             | String  | Required, min 6 (stored as bcrypt hash)  | —                              |
| `role`                 | String  | Enum: `admin`, `user`. Default: `user`   | Compound: `{ role, isActive }` |
| `isActive`             | Boolean | Default: `true`                          | Compound: `{ role, isActive }` |
| `resetPasswordToken`   | String  | Optional                                 | —                              |
| `resetPasswordExpires` | Date    | Optional                                 | —                              |

#### Event

| Field                | Type                | Constraints                                                                  | Index                             |
| -------------------- | ------------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| `eventName`          | String              | Required, max 200                                                            | Text index                        |
| `eventDescription`   | String              | Required, max 5000                                                           | —                                 |
| `eventCategory`      | String              | Enum: Party, Club Night, Concert, Festival, Pop-Up, Conference               | Compound: `{ category, status }`  |
| `eventImage`         | String              | Required                                                                     | —                                 |
| `eventBanner`        | String              | Optional                                                                     | —                                 |
| `venueName`          | String              | Required                                                                     | Text index                        |
| `addressLine`        | String              | Required                                                                     | —                                 |
| `city`               | String              | Required                                                                     | Compound: `{ city, status }`      |
| `postcode`           | String              | Required                                                                     | —                                 |
| `country`            | String              | Required                                                                     | —                                 |
| `mapsLink`           | String              | Optional                                                                     | —                                 |
| `eventDate`          | Date                | Required, must be future                                                     | Compound: `{ eventDate, status }` |
| `startTime`          | String              | Required                                                                     | —                                 |
| `endTime`            | String              | Required                                                                     | —                                 |
| `totalTickets`       | Number              | Required, min 0                                                              | —                                 |
| `ticketBatches`      | Array               | Min 1 batch. Each: `{ name, quantity, basePrice, minDiscount, maxDiscount }` | —                                 |
| `dynamicPricing`     | Boolean             | Default: `true`                                                              | —                                 |
| `bookingFee`         | Number              | Default: 10, range 0–100                                                     | —                                 |
| `allowResale`        | Boolean             | Default: `false`                                                             | —                                 |
| `platformCommission` | Number              | Required, range 0–100                                                        | —                                 |
| `status`             | String              | Enum: `draft`, `published`. Default: `draft`                                 | Multiple compounds                |
| `createdBy`          | ObjectId (ref User) | Optional                                                                     | Single                            |

**Pre-save hooks:** Validates `eventDate` is in the future; validates `minDiscount ≤ maxDiscount` and `basePrice > 0` per batch.

#### Ticket

| Field                   | Type                 | Constraints                                                  | Index                           |
| ----------------------- | -------------------- | ------------------------------------------------------------ | ------------------------------- |
| `orderId`               | ObjectId (ref Order) | Required                                                     | Single                          |
| `eventId`               | ObjectId (ref Event) | Required                                                     | Compound: `{ eventId, status }` |
| `userId`                | ObjectId (ref User)  | Required                                                     | Compound: `{ userId, status }`  |
| `eventName`             | String               | Required                                                     | —                               |
| `ticketBatchName`       | String               | Required                                                     | —                               |
| `purchasePrice`         | Number               | Required, min 0                                              | —                               |
| `originalPrice`         | Number               | Required, min 0                                              | —                               |
| `stripePaymentIntentId` | String               | Optional (for resale refunds)                                | —                               |
| `status`                | String               | Enum: `active`, `listed`, `transferred`, `used`, `cancelled` | Multiple compounds              |
| `qrCode`                | String               | Required, unique, default: `crypto.randomUUID()`             | Unique                          |

#### Order

| Field                   | Type                         | Constraints                                                      | Index  |
| ----------------------- | ---------------------------- | ---------------------------------------------------------------- | ------ |
| `eventId`               | ObjectId (ref Event)         | Required                                                         | Single |
| `userId`                | ObjectId (ref User)          | Optional                                                         | Single |
| `eventName`             | String                       | Required                                                         | —      |
| `ticketBatchName`       | String                       | Required                                                         | —      |
| `quantity`              | Number                       | Required, min 1                                                  | —      |
| `basePrice`             | Number                       | Required, min 0                                                  | —      |
| `capturedBookingFee`    | Number                       | Required, min 0                                                  | —      |
| `totalAmount`           | Number                       | Required, min 0                                                  | —      |
| `currency`              | String                       | Default: `gbp`                                                   | —      |
| `stripeSessionId`       | String                       | Required, unique                                                 | Unique |
| `stripePaymentIntentId` | String                       | Optional                                                         | —      |
| `type`                  | String                       | Enum: `primary`, `resale`. Default: `primary`                    | Single |
| `resaleListingId`       | ObjectId (ref ResaleListing) | Optional                                                         | —      |
| `status`                | String                       | Enum: `pending`, `paid`, `failed`, `expired`. Default: `pending` | Single |
| `customerEmail`         | String                       | Optional                                                         | —      |
| `customerName`          | String                       | Optional                                                         | —      |

#### ResaleListing

| Field                   | Type                  | Constraints                                                       | Index                           |
| ----------------------- | --------------------- | ----------------------------------------------------------------- | ------------------------------- |
| `ticketId`              | ObjectId (ref Ticket) | Required                                                          | Single                          |
| `eventId`               | ObjectId (ref Event)  | Required                                                          | Compound: `{ eventId, status }` |
| `sellerId`              | ObjectId (ref User)   | Required                                                          | Single                          |
| `askingPrice`           | Number                | Required, min 0                                                   | —                               |
| `originalPurchasePrice` | Number                | Required, min 0                                                   | —                               |
| `status`                | String                | Enum: `active`, `sold`, `cancelled`, `expired`. Default: `active` | Single + compound               |
| `buyerId`               | ObjectId (ref User)   | Optional                                                          | —                               |
| `resaleOrderId`         | ObjectId (ref Order)  | Optional                                                          | —                               |
| `platformFee`           | Number                | Default: 0                                                        | —                               |
| `sellerPayout`          | Number                | Default: 0                                                        | —                               |
| `organiserRevenue`      | Number                | Default: 0                                                        | —                               |
| `sellerRefundId`        | String                | Optional (Stripe refund ID)                                       | —                               |
| `sellerRefundStatus`    | String                | Enum: `pending`, `succeeded`, `failed`. Optional                  | —                               |

---

## 14. API Reference

### Base URL

```
Development: http://localhost:3016
Production:  https://api.onthelistapp.co.uk
```

### Response Format

All responses follow the `ApiResponse<T>` envelope:

```json
{
  "ok": true,
  "message": "Description of result",
  "data": { ... }
}
```

### Endpoints

#### Authentication (`/api/auth`)

| Method | Path               | Auth | Body                        | Response           |
| ------ | ------------------ | ---- | --------------------------- | ------------------ |
| POST   | `/register`        | No   | `{ name, email, password }` | `{ user, tokens }` |
| POST   | `/login`           | No   | `{ email, password }`       | `{ user, tokens }` |
| POST   | `/refresh`         | No   | `{ refreshToken }`          | `{ accessToken }`  |
| GET    | `/me`              | Yes  | —                           | `UserResponse`     |
| POST   | `/forgot-password` | No   | `{ email }`                 | Message            |
| POST   | `/reset-password`  | No   | `{ token, password }`       | Message            |

#### Events (`/api/events`)

| Method | Path          | Auth | Body/Params                 | Response                             |
| ------ | ------------- | ---- | --------------------------- | ------------------------------------ |
| GET    | `/published`  | No   | —                           | `EventResponse[]`                    |
| GET    | `/`           | Yes  | —                           | `EventResponse[]` (filtered by role) |
| GET    | `/:id`        | Yes  | —                           | `EventResponse`                      |
| POST   | `/`           | Yes  | `CreateEventInput`          | `EventResponse`                      |
| PUT    | `/:id`        | Yes  | `Partial<CreateEventInput>` | `EventResponse`                      |
| PATCH  | `/:id/status` | Yes  | `{ status }`                | `EventResponse`                      |
| DELETE | `/:id`        | Yes  | —                           | Message                              |

#### Users (`/api/users`) — Admin Only

| Method | Path          | Auth  | Body                              | Response         |
| ------ | ------------- | ----- | --------------------------------- | ---------------- |
| GET    | `/`           | Admin | —                                 | `UserResponse[]` |
| POST   | `/`           | Admin | `{ name, email, password, role }` | `UserResponse`   |
| PATCH  | `/:id/status` | Admin | `{ isActive }`                    | `UserResponse`   |
| PATCH  | `/:id/role`   | Admin | `{ role }`                        | `UserResponse`   |
| DELETE | `/:id`        | Admin | —                                 | Message          |

#### Tickets (`/api/tickets`)

| Method | Path   | Auth | Response           |
| ------ | ------ | ---- | ------------------ |
| GET    | `/my`  | Yes  | `TicketResponse[]` |
| GET    | `/:id` | Yes  | `TicketResponse`   |

#### Orders (`/api/orders`)

| Method | Path     | Auth  | Query Params                      | Response          |
| ------ | -------- | ----- | --------------------------------- | ----------------- |
| GET    | `/my`    | Yes   | —                                 | `OrderResponse[]` |
| GET    | `/`      | Admin | `?status=&type=&eventId=&search=` | `OrderResponse[]` |
| GET    | `/stats` | Admin | —                                 | `OrderStats`      |

#### Checkout (`/api/checkout`)

| Method | Path                          | Auth | Body                                            | Response             |
| ------ | ----------------------------- | ---- | ----------------------------------------------- | -------------------- |
| POST   | `/create-session`             | Yes  | `{ eventId, batchName, quantity, capturedFee }` | `{ sessionId, url }` |
| GET    | `/session/:sessionId`         | No   | —                                               | `OrderResponse`      |
| POST   | `/session/:sessionId/confirm` | No   | —                                               | `OrderResponse`      |
| POST   | `/webhook`                    | No*  | Raw body + `stripe-signature` header            | —                    |

*Webhook uses Stripe signature verification instead of JWT auth.

#### Resale (`/api/resale`)

| Method | Path              | Auth | Body                        | Response                  |
| ------ | ----------------- | ---- | --------------------------- | ------------------------- |
| POST   | `/list`           | Yes  | `{ ticketId, askingPrice }` | `ResaleListingResponse`   |
| GET    | `/my`             | Yes  | —                           | `ResaleListingResponse[]` |
| DELETE | `/:id`            | Yes  | —                           | `ResaleListingResponse`   |
| GET    | `/event/:eventId` | No   | —                           | `ResaleListingResponse[]` |
| POST   | `/:id/buy`        | Yes  | `{ capturedFee }`           | `{ sessionId, url }`      |

#### Uploads (`/api/uploads`)

| Method | Path | Auth | Body                                  | Response  |
| ------ | ---- | ---- | ------------------------------------- | --------- |
| POST   | `/`  | Yes  | `multipart/form-data` (field: `file`) | `{ url }` |

#### Health (`/api/health`)

| Method | Path      | Auth | Response                                  |
| ------ | --------- | ---- | ----------------------------------------- |
| GET    | `/health` | No   | `{ ok: true, message: "API is running" }` |

---

## 15. Build & Deployment Pipeline

### 15.1 Turborepo Configuration

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "seed": { "cache": false }
  }
}
```

### 15.2 Build Commands

| Command              | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `npm run build`      | Build all packages and apps (respects dependency order) |
| `npm run dev`        | Start all apps in development mode                      |
| `npm run dev:api`    | Start only the API server (with nodemon)                |
| `npm run dev:web`    | Start only the web app                                  |
| `npm run dev:admin`  | Start only the admin panel                              |
| `npm run dev:mobile` | Start only the mobile app (Expo)                        |
| `npm run seed`       | Seed the database with admin user                       |

### 15.3 TypeScript Configuration

Base config (`tsconfig.base.json`):
- Target: ES2022
- Module: ESNext
- Module Resolution: Bundler
- Strict mode enabled
- Declaration + source maps

### 15.4 Platform-Specific Tailwind Handling

Tailwind CSS v4 uses `@tailwindcss/oxide`, a native Rust binary. For cross-platform deployment (develop on Windows, deploy on Linux):

```json
// apps/web/package.json & apps/admin/package.json
{
  "optionalDependencies": {
    "@tailwindcss/oxide-linux-x64-gnu": "^4",
    "@tailwindcss/oxide-linux-x64-musl": "^4"
  }
}
```

These are skipped on Windows but installed on Linux servers.

---

## 16. Environment Configuration

### Required Environment Variables

| Variable                 | Description                                          | Example                                       |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------- |
| `MONGODB_URI`            | MongoDB connection string                            | `mongodb://user:pass@host:port/db`            |
| `PORT`                   | API server port                                      | `3016`                                        |
| `AUTH_SECRET`            | JWT signing secret                                   | Random 256-bit base64 string                  |
| `WEB_URL`                | Web app base URL (for email links, Stripe redirects) | `http://localhost:3001`                       |
| `CORS_ORIGIN`            | Comma-separated allowed origins                      | `http://localhost:3001,http://localhost:3003` |
| `NEXT_PUBLIC_API_URL`    | API URL for frontend apps                            | `http://localhost:3016`                       |
| `STRIPE_SECRET_KEY`      | Stripe secret key                                    | `sk_test_...`                                 |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key                               | `pk_test_...`                                 |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signing secret                        | `whsec_...`                                   |
| `SMTP_SERVER`            | SMTP mail server host                                | `mail.example.com`                            |
| `SMTP_PORT`              | SMTP port                                            | `587`                                         |
| `SMTP_USER`              | SMTP username/email                                  | `noreply@example.com`                         |
| `SMTP_PASSWORD`          | SMTP password                                        | —                                             |

### Environment Loading

The API loads environment variables in this order (later values override earlier):
1. `.env` (base defaults)
2. `.env.local` (local overrides, not committed)

---

## 17. Security Considerations

### 17.1 Authentication Security

| Measure               | Implementation                                       |
| --------------------- | ---------------------------------------------------- |
| Password hashing      | bcrypt with 10 salt rounds                           |
| JWT tokens            | Short-lived access (2h) + long-lived refresh (7d)    |
| Token refresh         | Automatic with concurrent request deduplication      |
| Account deactivation  | Checked on every `getMe()` and `refreshToken()` call |
| Password reset tokens | `crypto.randomBytes(32)` with 1-hour expiry          |

### 17.2 API Security

| Measure           | Implementation                                              |
| ----------------- | ----------------------------------------------------------- |
| CORS              | Explicit origin whitelist from `CORS_ORIGIN`                |
| Input validation  | Zod schemas on all mutation endpoints                       |
| MongoDB injection | Mongoose parameterized queries; regex special chars escaped |
| File upload       | Multer with size limits                                     |
| Stripe webhooks   | Signature verification with `STRIPE_WEBHOOK_SECRET`         |
| Error responses   | No stack traces or internal details in production errors    |

### 17.3 Payment Security

| Measure                | Implementation                                      |
| ---------------------- | --------------------------------------------------- |
| No card data on server | Stripe Checkout (hosted payment page)               |
| Idempotent processing  | Orders checked by `stripeSessionId` before creation |
| Dual confirmation      | Client polling + webhook for reliability            |
| Refund tracking        | `sellerRefundId` and `sellerRefundStatus` stored    |

### 17.4 Ticket Security

| Measure                     | Implementation                                                    |
| --------------------------- | ----------------------------------------------------------------- |
| QR code uniqueness          | `crypto.randomUUID()` per ticket                                  |
| QR regeneration on transfer | New QR code generated when ticket changes owner via resale        |
| Ownership enforcement       | All ticket operations verify `ticket.userId === requestingUserId` |

---

## 18. Error Handling Strategy

### 18.1 API Error Flow

```
Controller (async)
    │
    └── asyncHandler wraps in try/catch
            │
            ├── Business error → throw AppError.xxx()
            │
            ├── Validation error → Zod throws ZodError
            │
            └── Unexpected error → falls through
                    │
                    ▼
            Global Error Handler (middleware/error.ts)
                    │
                    ├── AppError → { ok: false, message, statusCode }
                    ├── ZodError → { ok: false, errors: [...], 400 }
                    ├── Mongoose ValidationError → { ok: false, errors: [...], 400 }
                    ├── Mongoose CastError → { ok: false, "Invalid ID", 400 }
                    ├── MongoDB 11000 → { ok: false, "Duplicate", 409 }
                    ├── Multer → { ok: false, "File too large", 413 }
                    └── Unknown → { ok: false, "Internal server error", 500 }
```

### 18.2 Client Error Flow

```
FatsomaClient.request()
    │
    ├── Response ok → return parsed JSON
    │
    ├── 401 → tryRefresh()
    │           ├── Success → retry original request
    │           └── Failure → onAuthFailure() (logout)
    │
    └── Other error → throw ApiError(message, status, body)
            │
            ▼
    Component catch block
            │
            └── setError(err.message) → display to user
```

### 18.3 Email Error Handling

All email functions are fire-and-forget:
- Errors are logged to console but never thrown
- This prevents email delivery failures from blocking payment confirmation or user registration
- Pattern: `send().catch(err => console.error(...))`

---

*This document reflects the system architecture as of March 2026. For the latest changes, refer to the git history.*
