# Fatsoma Clone - Event Management Platform

A modern event management and ticketing platform built with Next.js 16, featuring a dark-themed admin dashboard for organizers to create, manage, and publish events with dynamic pricing and flexible ticket batches.

## 🎯 Features

### Admin Dashboard
- **Event Creation Form**: Comprehensive form with validation using React Hook Form
- **Dark Theme UI**: Modern purple/blue gradient design with glassmorphism effects
- **Dynamic Ticket Batches**: Create multiple ticket phases with different pricing
- **Live Revenue Preview**: Real-time calculation of potential earnings
- **Draft & Publish**: Save events as drafts or publish them immediately
- **Responsive Design**: Fully responsive layout optimized for all devices

### Event Management
- **View All Events**: Browse all created events in a card-based grid layout
- **Event Details**: Detailed view of individual events with all configuration
- **Status Indicators**: Visual badges for draft/published status
- **Quick Navigation**: Easy navigation between create, list, and detail views

### Technical Features
- **MongoDB Database**: Production-ready MongoDB integration with Mongoose ODM
- **Server Actions**: Use Next.js server actions for mutations (create, update, delete)
- **API Routes**: RESTful GET endpoint for fetching events
- **Type Safety**: Full TypeScript support throughout
- **Form Validation**: Comprehensive client-side validation with error messages
- **Reusable Components**: Modular form components (InputField, TextareaField, ToggleField)
- **Connection Pooling**: Efficient database connection management for serverless environments
- **Schema Validation**: Mongoose schema validation with indexes for optimal performance

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- npm, yarn, pnpm, or bun
- MongoDB Atlas account (free tier available) or local MongoDB installation

### MongoDB Setup

#### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Set up database access (username & password)
4. Whitelist your IP address or allow access from anywhere (0.0.0.0/0)
5. Get your connection string

#### Option 2: Local MongoDB
1. Install MongoDB locally: [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/fatsoma-clone`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and add your MongoDB connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatsoma-clone
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fatsoma-clone?retryWrites=true&w=majority

# Optional: Base URL for server-side API calls
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Development

```bash
# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the admin dashboard.

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── actions/
│   │   └── events.ts          # Server actions for event mutations
│   ├── api/
│   │   └── events/
│   │       └── route.ts       # GET API routes
│   ├── events/
│   │   ├── page.tsx           # Events list page
│   │   └── [id]/
│   │       └── page.tsx       # Event detail page
│   ├── layout.tsx             # Root layout with fonts
│   ├── globals.css            # Global styles & animations
│   └── page.tsx               # Admin dashboard (event creation)
├── components/
│   └── forms/
│       ├── InputField.tsx     # Reusable input component
│       ├── TextareaField.tsx  # Reusable textarea component
│       └── ToggleField.tsx    # Reusable toggle component
├── lib/
│   ├── mongodb.ts             # MongoDB connection utility with pooling
│   └── event-store.ts         # Legacy in-memory store (deprecated)
└── models/
    └── Event.ts               # Mongoose Event model with schema validation
```
│       └── ToggleField.tsx    # Reusable toggle component
└── lib/
    └── event-store.ts         # In-memory event storage (replace with DB)
```

## 🎨 Design System

### Colors
- **Background**: `#0f0f0f` (near black)
- **Cards**: `zinc-950/60` with glassmorphism
- **Accent**: Purple to blue gradient
- **Text**: Zinc color scale for hierarchy

### Typography
- **Sans**: Space Grotesk
- **Mono**: IBM Plex Mono

### Components
- **Rounded corners**: `xl` (12px)
- **Borders**: `white/10` for subtle separation
- **Shadows**: Deep shadows for depth
- **Animations**: Floating glow and shimmer effects

## 📋 Event Form Fields

### Basic Details
- Event Name (required)
- Event Description (required)
- Event Category (required)
- Event Image Upload (required)
- Event Banner Upload (optional)

### Location
- Venue Name (required)
- Address Line (required)
- City (required)
- Postcode (required)
- Country (required)
- Google Maps Link (optional)

### Date & Time
- Event Date (required)
- Start Time (required)
- End Time (required)

### Ticket Configuration
- Total Number of Tickets (required)
- Ticket Batches (dynamic):
  - Batch Name
  - Number of Tickets
  - Base Price (£)
  - Minimum Price (£)
  - Maximum Price (£)

### Pricing Settings
- Enable Dynamic Pricing (toggle)
- Booking Fee Percentage (0-10%)
- Allow Ticket Resale (toggle)
- Platform Commission Percentage

## 🔌 API & Data Layer

### GET /api/events
Fetch all events from MongoDB

```typescript
Response: {
  ok: boolean;
  events: Event[];
}
```

### Server Actions
Located in `src/app/actions/events.ts`:

- `createEvent(input, status)` - Create new event as draft or published in MongoDB
- `updateEventStatus(eventId, status)` - Update event status
- `deleteEvent(eventId)` - Delete an event from database
- `getAllEvents()` - Fetch all events (used by server components)
- `getEventById(eventId)` - Fetch single event by ID

### MongoDB Schema

The Event model includes:
- **Validation**: Required fields, min/max values, enum constraints
- **Indexes**: Optimized queries on eventDate, status, city, category, createdAt
- **Virtual Fields**: Computed properties for total tickets and revenue range
- **Pre-save Hooks**: Date validation, price range validation
- **Timestamps**: Automatic createdAt and updatedAt tracking

Key schema features:
```typescript
- eventName: string (required, indexed, max 200 chars)
- eventCategory: enum (Party, Club Night, Concert, Festival, Pop-Up, Conference)
- eventDate: Date (required, indexed, must be future date)
- ticketBatches: Array of nested documents with price validation
- status: enum (draft, published) - indexed
- Compound indexes for performance (eventDate + status, city + status, etc.)
```
- `deleteEvent(eventId)` - Delete an event

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Styling**: TailwindCSS v4
- **Forms**: React Hook Form
- **Fonts**: Google Fonts (Space Grotesk, IBM Plex Mono)
- **Linting**: ESLint with Next.js config

## 📝 Production Notes

### Database
The application uses MongoDB with Mongoose for production-ready data persistence:
- **Connection Pooling**: Efficient connection management for serverless environments
- **Schema Validation**: Mongoose models with TypeScript interfaces
- **Indexes**: Optimized queries for better performance
- **Error Handling**: Comprehensive validation and error messages

### File Uploads
File inputs currently store placeholder names. For production:
- Integrate with cloud storage (AWS S3, Cloudinary, DigitalOcean Spaces)
- Update the form to handle actual file uploads
- Store file URLs in the database instead of placeholders

### Environment Variables
Required environment variables:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Deployment Checklist
- [ ] Set up MongoDB Atlas cluster or MongoDB instance
- [ ] Configure environment variables in deployment platform
- [ ] Set up file upload service (S3, Cloudinary, etc.)
- [ ] Configure domain and SSL certificate
- [ ] Set up monitoring and error tracking
- [ ] Configure database backups

## 🚧 Future Enhancements

- [ ] Database integration (Prisma + PostgreSQL)
- [ ] Real file upload handling
- [ ] Event editing functionality
- [ ] Event deletion with confirmation
- [ ] Search and filter events
- [ ] Event analytics dashboard
- [ ] Ticket sales tracking
- [ ] Email notifications
- [ ] User authentication

## 📄 License

This project is built for educational purposes.

---

Built with ❤️ using Next.js
