import { z } from "zod";
import { EVENT_CATEGORIES, EVENT_STATUSES, USER_ROLES } from "./constants";

export const ticketBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required").trim(),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  basePrice: z.number().min(0, "Price cannot be negative"),
  minDiscount: z.number().min(0).max(100),
  maxDiscount: z.number().min(0).max(100),
}).refine((b) => b.minDiscount <= b.maxDiscount, {
  message: "Minimum discount cannot exceed maximum discount",
  path: ["minDiscount"],
});

export const createEventSchema = z.object({
  eventName: z.string().min(1).max(200).trim(),
  eventDescription: z.string().min(1).max(5000).trim(),
  eventCategory: z.enum(EVENT_CATEGORIES),
  eventImage: z.string().min(1),
  eventBanner: z.string().optional(),
  venueName: z.string().min(1).trim(),
  addressLine: z.string().min(1).trim(),
  city: z.string().min(1).trim(),
  postcode: z.string().min(1).trim(),
  country: z.string().min(1).trim(),
  mapsLink: z.string().optional(),
  eventDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  totalTickets: z.number().min(0),
  ticketBatches: z.array(ticketBatchSchema).min(1, "At least one ticket batch is required"),
  dynamicPricing: z.boolean(),
  bookingFee: z.number().min(0).max(100),
  allowResale: z.boolean(),
  platformCommission: z.number().min(0).max(100),
  status: z.enum(EVENT_STATUSES),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(USER_ROLES),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type CreateEventPayload = z.infer<typeof createEventSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;
