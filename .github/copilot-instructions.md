# Fatsoma Clone - Project Instructions

## Project Overview

Event management platform built with Next.js 16, TypeScript, TailwindCSS, React Hook Form, MongoDB with Mongoose ODM, and NextAuth.js for authentication.

## Completed Setup Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete
- [x] Add MongoDB integration with Mongoose
- [x] Add authentication with NextAuth.js
- [x] Add user management system

## Architecture

### Authentication

- **NextAuth.js v5**: JWT-based authentication
- **Configuration**: `src/auth.ts` with credentials provider
- **Middleware**: `src/middleware.ts` - Protects routes, redirects unauthorized users
- **Roles**: Admin (full access) and User (can create events)
- **Session**: Stored in JWT tokens with user ID and role

### Database Layer

(protected, requires login)

- `/login` - Login page for authentication
- `/admin/users` - User management (admin only)
- `/events` - List all events (protected, requires login)
- `/events/[id]` - Event detail page (protected, requires login)
- `/events/[id]/edit` - Edit event page (protected, requires login
  - User model with roles and authentication
  - Event model with validation, indexes, and virtuals
- **Location**: `src/lib/mongodb.ts` (connection), `src/models/` (schemas)

### Pages

- `/` - Admin dashboard for creating events
- `/events` - List all events (server-side with server actions)
- `/events/[id]` - Event detail page (server-side with server actions)
- `/events/[id]/edit` - Edit event page (client-side form with pre-populated data)

### API & Actions

`POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints

- Server Actions in `src/app/actions/events.ts`:
  - `createEvent()` - Create events with MongoDB (requires authentication)
  - `updateEvent()` - Update existing events (requires authentication)
  - `updateEventStatus()` - Update event status (requires authentication)
  - `deleteEvent()` - Delete events (requires authentication)
  - `getAllEvents()` - Fetch all events
  - `getEventById()` - Fetch single event
- Server Actions in `src/app/actions/upload.ts`:
  - `uploadImage()` - Upload event images to local storage (requires authentication)
- Server Actions in `src/app/actions/users.ts`:
  - `createUser()` - Create new user (admin only)
- `src/auth.ts` - NextAuth.js configuration with credentials provider
- `src/middleware.ts` - Route protection and authentication middleware
- `src/models/User.ts` - Mongoose User model with roles
- `src/models/Event.ts` - Mongoose Event model with validation
- `src/lib/mongodb.ts` - MongoDB connection with pooling and caching
- `src/app/actions/events.ts` - Server actions for database operations
- `src/app/actions/upload.ts` - Server action for image uploads
- `src/app/actions/users.ts` - Server actions for user management
- `src/app/login/page.tsx` - Login page
- `src/app/admin/users/page.tsx` - Admin user management page
- `src/components/admin/UserManagement.tsx` - User management UI component
- `src/components/admin/EventCreateForm.tsx` - Event creation form
- `src/components/forms/` - Reusable form components
- `src/components/events/EventImage.tsx` - Image display component
- `src/components/events/EventCard.tsx` - Event card component
- `src/components/events/EventEditForm.tsx` - Event edit form component
- `src/app/globals.css` - Dark theme styling
- `public/uploads/` - Local image storage directory
- `scripts/seed.ts` - Database seeding script for initial admin useroling and caching
- `src/models/Event.ts` - Mongoose Event model with validation
  AUTH_SECRET=your-secret-key-here # Generate with: openssl rand -base64 32
- `src/app/actions/events.ts` - Server actions for database operations
- `src/app/actions/upload.ts` - Server action for image uploads
- `src/components/forms/` - Reusable form components
- `src/components/events/EventImage.tsx` - Image display compo
- `src/components/events/EventEditForm.tsx` - Event edit form componentnent
- `src/components/events/EventCard.tsx` - Event card component
- `src/app/globals.css` - Dark theme styling
- `public/uploads/` - Local image storage directory

## Environment Setup

Required `.env. # Start development server
npm run build # Create production build
npm start # Run production server
npm run seed # Create initial admin user (admin@fatsoma.com / admin123)

```

## First Time Setup

1. Install dependencies: `npm install`
2. Set up `.env.local` with MongoDB URI and AUTH_SECRET
3. Run seed script: `npm run seed`
4. Start dev server: `npm run dev`
5. Login with admin@fatsoma.com / admin123
6. Go to Manage Users to add more usersGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatsoma-clone
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Create production build
npm start      # Run production server
```

## Notes

- All mutations use server actions (Next.js "use server")
- Read operatiostored locally in `public/uploads/` directory
- Images validated for type (images only) and size (max 5MB)
- Unique filenames generated using timestamp and random hash
- MongoDB connection is cached globally to prevent connection exhaustion
- Schema validation with Mongoose ensures data integrity
- Indexes on frequently queried fields for optimal performance
- File uploads return placeholder names (integrate cloud storage for production)
