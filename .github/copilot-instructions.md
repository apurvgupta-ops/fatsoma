# Fatsoma Clone - Project Instructions

## Project Overview

Event management platform built with Next.js 16, TypeScript, TailwindCSS, React Hook Form, and MongoDB with Mongoose ODM.

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

## Architecture

### Database Layer

- **MongoDB**: Production database with Mongoose ODM
- **Connection**: Cached connection pooling for serverless optimization
- **Schema**: Event model with validation, indexes, and virtuals
- **Location**: `src/lib/mongodb.ts` (connection), `src/models/Event.ts` (schema)

### Pages

- `/` - Admin dashboard for creating events
- `/events` - List all events (server-side with server actions)
- `/events/[id]` - Event detail page (server-side with server actions)

### API & Actions

- `GET /api/events` - Fetch all events from MongoDB
- Server Actions in `src/app/actions/events.ts`:
  - `createEvent()` - Create events with MongoDB
  - `updateEventStatus()` - Update event status
  - `deleteEvent()` - Delete events
  - `getAllEvents()` - Fetch all events
  - `getEventById()` - Fetch single event

### Key Files

- `src/lib/mongodb.ts` - MongoDB connection with pooling and caching
- `src/models/Event.ts` - Mongoose Event model with validation
- `src/app/actions/events.ts` - Server actions for database operations
- `src/components/forms/` - Reusable form components
- `src/app/globals.css` - Dark theme styling

## Environment Setup

Required `.env.local` file:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatsoma-clone
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
- Read operations can use server actions or GET API
- MongoDB connection is cached globally to prevent connection exhaustion
- Schema validation with Mongoose ensures data integrity
- Indexes on frequently queried fields for optimal performance
- File uploads return placeholder names (integrate cloud storage for production)
