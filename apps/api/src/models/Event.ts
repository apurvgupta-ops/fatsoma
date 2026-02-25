import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITicketBatch {
  name: string;
  quantity: number;
  basePrice: number;
  minDiscount: number;
  maxDiscount: number;
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventName: string;
  eventDescription: string;
  eventCategory: string;
  eventImage: string;
  eventBanner?: string;
  venueName: string;
  addressLine: string;
  city: string;
  postcode: string;
  country: string;
  mapsLink?: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
  totalTickets: number;
  ticketBatches: ITicketBatch[];
  dynamicPricing: boolean;
  bookingFee: number;
  allowResale: boolean;
  platformCommission: number;
  status: "draft" | "published";
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TicketBatchSchema = new Schema<ITicketBatch>(
  {
    name: { type: String, required: [true, "Batch name is required"], trim: true },
    quantity: { type: Number, required: [true, "Ticket quantity is required"], min: [0, "Quantity cannot be negative"] },
    basePrice: { type: Number, required: [true, "Base price is required"], min: [0, "Price cannot be negative"] },
    minDiscount: { type: Number, required: true, min: [0, "Discount cannot be negative"], max: [100, "Discount cannot exceed 100%"] },
    maxDiscount: { type: Number, required: true, min: [0, "Discount cannot be negative"], max: [100, "Discount cannot exceed 100%"] },
  },
  { _id: false },
);

const EventSchema = new Schema<IEvent>(
  {
    eventName: { type: String, required: [true, "Event name is required"], trim: true, maxlength: [200, "Event name cannot exceed 200 characters"], index: true },
    eventDescription: { type: String, required: [true, "Event description is required"], trim: true, maxlength: [5000, "Description cannot exceed 5000 characters"] },
    eventCategory: { type: String, required: [true, "Event category is required"], enum: ["Party", "Club Night", "Concert", "Festival", "Pop-Up", "Conference"], index: true },
    eventImage: { type: String, required: [true, "Event image is required"] },
    eventBanner: { type: String },
    venueName: { type: String, required: [true, "Venue name is required"], trim: true, index: true },
    addressLine: { type: String, required: [true, "Address is required"], trim: true },
    city: { type: String, required: [true, "City is required"], trim: true, index: true },
    postcode: { type: String, required: [true, "Postcode is required"], trim: true },
    country: { type: String, required: [true, "Country is required"], trim: true, index: true },
    mapsLink: { type: String, trim: true },
    eventDate: { type: Date, required: [true, "Event date is required"], index: true },
    startTime: { type: String, required: [true, "Start time is required"] },
    endTime: { type: String, required: [true, "End time is required"] },
    totalTickets: { type: Number, required: [true, "Total tickets is required"], min: [0, "Total tickets cannot be negative"] },
    ticketBatches: { type: [TicketBatchSchema], required: [true, "At least one ticket batch is required"], validate: { validator: (batches: ITicketBatch[]) => batches.length > 0, message: "At least one ticket batch is required" } },
    dynamicPricing: { type: Boolean, default: true },
    bookingFee: { type: Number, required: [true, "Booking fee is required"], min: [0, "Booking fee cannot be negative"], max: [100, "Booking fee cannot exceed 100%"] },
    allowResale: { type: Boolean, default: false },
    platformCommission: { type: Number, required: [true, "Platform commission is required"], min: [0, "Commission cannot be negative"], max: [100, "Commission cannot exceed 100%"] },
    status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        const { _id, __v, ...rest } = ret;
        return { id: ret.id, ...rest };
      },
    },
  },
);

EventSchema.index({ eventDate: 1, status: 1 });
EventSchema.index({ city: 1, status: 1 });
EventSchema.index({ eventCategory: 1, status: 1 });
EventSchema.index({ createdAt: -1 });

EventSchema.virtual("totalTicketsFromBatches").get(function () {
  return this.ticketBatches.reduce((sum, batch) => sum + batch.quantity, 0);
});

EventSchema.pre("save", function (next) {
  if (this.isNew && this.eventDate < new Date()) {
    next(new Error("Event date must be in the future"));
  }
  for (const batch of this.ticketBatches) {
    if (batch.minDiscount > batch.maxDiscount) {
      next(new Error(`Batch "${batch.name}": minimum discount cannot exceed maximum discount`));
    }
    if (batch.basePrice <= 0) {
      next(new Error(`Batch "${batch.name}": base price must be greater than 0`));
    }
  }
  next();
});

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
export default Event;
