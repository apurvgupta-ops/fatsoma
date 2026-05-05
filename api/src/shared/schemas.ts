import { z } from "zod";
import {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  STAFF_GATE_NAMES,
  USER_ROLES,
} from "./constants";

const optionalDateTimeString = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Entry window cutoff must be a valid datetime",
  });

export const ticketBatchSchema = z
  .object({
    name: z.string().min(1, "Batch name is required").trim(),
    quantity: z.number().min(0, "Quantity cannot be negative"),
    basePrice: z.number().gt(0, "Price must be greater than 0"),
    minDiscount: z
      .number()
      .min(0, "Minimum discount cannot be negative")
      .max(100, "Minimum discount cannot exceed 100"),
    maxDiscount: z
      .number()
      .min(0, "Maximum discount cannot be negative")
      .max(100, "Maximum discount cannot exceed 100"),
    entryWindowCutoff: optionalDateTimeString,
  })
  .refine((b) => b.minDiscount <= b.maxDiscount, {
    message: "Minimum discount cannot exceed maximum discount",
    path: ["minDiscount"],
  });

export const ticketGroupSchema = z.object({
  title: z.string().min(1, "Group title is required").max(200).trim(),
  sortOrder: z.number().optional(),
  batches: z
    .array(ticketBatchSchema)
    .min(1, "Each group must contain at least one ticket slot"),
});

export const createEventSchema = z
  .object({
  eventName: z
    .string()
    .min(1, "Event name is required")
    .max(200, "Event name cannot exceed 200 characters")
    .trim(),
  eventDescription: z
    .string()
    .min(1, "Event description is required")
    .max(5000, "Event description cannot exceed 5000 characters")
    .trim(),
  eventCategory: z.enum(EVENT_CATEGORIES),
  eventImage: z.string().min(1, "Event image is required"),
  eventBanner: z.string().optional(),
  venueName: z.string().min(1, "Venue name is required").trim(),
  addressLine: z.string().min(1, "Address line is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  postcode: z.string().min(1, "Postcode is required").trim(),
  country: z.string().min(1, "Country is required").trim(),
  mapsLink: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  eventEndDate: z.string().min(1).optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalTickets: z.number().min(1, "Total tickets must be greater than 0"),
  ticketGroups: z.array(ticketGroupSchema).optional(),
  ticketBatches: z.array(ticketBatchSchema).optional(),
  dynamicPricing: z.boolean(),
  bookingFee: z
    .number()
    .min(0, "Booking fee cannot be negative")
    .max(100, "Booking fee cannot exceed 100%")
    .optional(),
  allowResale: z.boolean(),
  platformCommission: z
    .number()
    .min(0, "Platform commission cannot be negative")
    .max(100, "Platform commission cannot exceed 100%"),
  status: z.enum(EVENT_STATUSES),
})
  .refine(
    (d) =>
      (d.ticketGroups && d.ticketGroups.length > 0) ||
      (d.ticketBatches && d.ticketBatches.length > 0),
    {
      message: "Add at least one ticket group with slots (or legacy flat batches)",
      path: ["ticketGroups"],
    },
  )
  .superRefine((d, ctx) => {
    const end =
      d.eventEndDate && d.eventEndDate.trim().length > 0
        ? d.eventEndDate.trim()
        : d.eventDate;
    if (end < d.eventDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be before start date",
        path: ["eventEndDate"],
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(USER_ROLES),
});

export const createStaffUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  staffEventId: z.string().trim().min(1, "Event is required"),
  staffGateName: z.enum(STAFF_GATE_NAMES, {
    message: "Please select a valid gate",
  }),
});

export const patchUserActiveSchema = z.object({
  isActive: z.boolean(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const validateTicketScanSchema = z.object({
  qrCode: z.string().min(1, "QR code is required").trim(),
  eventId: z.string().trim().optional(),
});

export const assignEventOwnerSchema = z.object({
  organizerId: z.string().trim().min(1, "Organizer ID is required"),
});

export type CreateEventPayload = z.infer<typeof createEventSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type CreateStaffUserPayload = z.infer<typeof createStaffUserSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;
export type AssignEventOwnerPayload = z.infer<typeof assignEventOwnerSchema>;
