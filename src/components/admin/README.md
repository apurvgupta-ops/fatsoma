# Admin Components

Production-level, reusable components for the event management admin dashboard.

## Component Structure

### Layout Components

#### `PageHeader`
- **Purpose**: Main page header with title and navigation
- **Location**: Top of admin page
- **Features**: 
  - Branded title and description
  - "View All Events" navigation link
  - Responsive layout

#### `PublishSidebar` 
- **Purpose**: Sticky sidebar with publish controls and live summary
- **Location**: Right sidebar on desktop
- **Features**:
  - Save as Draft button
  - Publish Event button (submits form)
  - View All Events link
  - Live event summary preview
  - Sticky positioning

#### `MobilePublishFooter`
- **Purpose**: Fixed bottom footer for mobile devices
- **Location**: Bottom of screen on mobile only
- **Features**:
  - Fixed sticky positioning
  - Gradient fade-in effect
  - Mobile-only visibility

### Form Section Components

#### `EventDetailsSection`
- **Purpose**: Basic event information form
- **Fields**:
  - Event Name (required)
  - Event Category (dropdown, required)
  - Event Description (textarea, required)
  - Event Image Upload (required)
  - Event Banner Upload (optional)
- **Validation**: All required fields validated via React Hook Form

#### `LocationDetailsSection`
- **Purpose**: Venue and address information
- **Fields**:
  - Venue Name (required)
  - Address Line (required)
  - City (required)
  - Postcode (required)
  - Country (required)
  - Google Maps Link (optional)

#### `DateTimeSection`
- **Purpose**: Event timing details
- **Fields**:
  - Event Date (date picker, required)
  - Start Time (time picker, required)
  - End Time (time picker, required)

#### `TicketConfigSection`
- **Purpose**: Ticket batch configuration and capacity management
- **Features**:
  - Total tickets input
  - Remaining capacity calculator
  - Dynamic ticket batches (add/remove)
  - Batch totals display
- **Sub-components**: Uses `TicketBatchCard` for each batch

#### `PricingModelSection`
- **Purpose**: Pricing, fees, and revenue settings
- **Features**:
  - Dynamic pricing toggle
  - Ticket resale toggle
  - Booking fee percentage
  - Platform commission percentage
  - Revenue preview (uses `RevenuePreview`)

### Micro Components

#### `TicketBatchCard`
- **Purpose**: Individual ticket batch form
- **Fields**:
  - Batch Name
  - Quantity
  - Base Price
  - Min Price
  - Max Price
- **Features**: Remove button (when multiple batches exist)

#### `RevenuePreview`
- **Purpose**: Visual revenue estimation display
- **Features**:
  - Animated revenue curve graph
  - Min/max revenue range display
  - Fee percentages summary
  - Glassmorphism design

#### `Toast`
- **Purpose**: Success/error notification display
- **Features**:
  - Auto-dismiss after 3 seconds
  - Success (green) or error (red) styling
  - Fixed top-right positioning

## Usage Example

```tsx
import {
  PageHeader,
  EventDetailsSection,
  LocationDetailsSection,
  DateTimeSection,
  TicketConfigSection,
  PricingModelSection,
  PublishSidebar,
  Toast,
  MobilePublishFooter,
} from "@/components/admin";

// Or import individually
import PageHeader from "@/components/admin/PageHeader";
```

## Type Definitions

All shared types are defined in `@/types/event-form.ts`:

- `EventFormValues` - Complete form data structure
- `TicketBatch` - Ticket batch configuration
- `ToastState` - Toast notification state
- `TicketTotals` - Calculated ticket and revenue totals

## Design System

### Theme
- **Background**: `#0f0f0f` (near black)
- **Surfaces**: `zinc-950/60` with glassmorphism
- **Accents**: Purple (`purple-500`) and Blue (`blue-400`)
- **Text**: `zinc-100` (primary), `zinc-400` (secondary)

### Component Patterns
- **Cards**: `rounded-3xl` with `border-white/10`
- **Inputs**: `rounded-xl` with purple focus rings
- **Buttons**: Gradient purple/blue with hover effects
- **Shadows**: `shadow-[0_20px_60px_rgba(0,0,0,0.35)]`

### Responsive Breakpoints
- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md)
- **Desktop**: `>= 1024px` (lg)

## Component Props

### Commonly Shared Props

```tsx
// Form Integration
register: UseFormRegister<EventFormValues>
errors: FieldErrors<EventFormValues>
watch: UseFormWatch<EventFormValues>
setValue: UseFormSetValue<EventFormValues>

// Ticket Management
fields: FieldArrayWithId<EventFormValues, "ticketBatches", "id">[]
append: UseFieldArrayAppend<EventFormValues, "ticketBatches">
remove: UseFieldArrayRemove

// Calculated Data
totals: TicketTotals
```

## Best Practices

1. **Component Size**: Keep components focused on a single section/responsibility
2. **Prop Drilling**: Pass only necessary props to each component
3. **Validation**: Handle all validation errors within the component
4. **Accessibility**: Use semantic HTML and proper labels
5. **Responsiveness**: Test on mobile, tablet, and desktop breakpoints
6. **Type Safety**: Use TypeScript for all props and state

## File Structure

```
src/components/admin/
├── index.ts                    # Barrel export
├── PageHeader.tsx              # Page header
├── EventDetailsSection.tsx     # Basic details form
├── LocationDetailsSection.tsx  # Location form  
├── DateTimeSection.tsx         # Date/time form
├── TicketConfigSection.tsx     # Ticket configuration
├── TicketBatchCard.tsx         # Individual batch
├── PricingModelSection.tsx     # Pricing settings
├── RevenuePreview.tsx          # Revenue visualization
├── PublishSidebar.tsx          # Sidebar controls
├── Toast.tsx                   # Notifications
└── MobilePublishFooter.tsx     # Mobile footer
```

## Maintenance Notes

- Components are tightly coupled to React Hook Form
- Form validation errors are displayed inline
- All sections styled consistently with dark theme
- Mobile-first responsive design
- TailwindCSS v4 syntax with custom gradients
