import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  orderId: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  service: string;
  notes?: string;
  dynamicFields: {
    preferredDate?: string;
    timeSlot?: string;
    shootArea?: string;
    eventType?: string;
    extraHourRequested?: string;
    calculatedTotalPrice?: string;
    planTitle?: string;
    bookingDepositPaid?: string;
  };
  paymentStatus: "pending" | "paid" | "failed";
  transactionId?: string;
  paymentConfirmedAmount?: number;
  paymentConfirmedAt?: Date;
  assignedTeam: mongoose.Types.ObjectId[]; // ref to User
  bookingStatus: "Pending" | "Confirmed" | "Scheduled" | "Editing" | "Delivered" | "Completed";
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    service: { type: String, required: true },
    notes: { type: String },
    dynamicFields: {
      preferredDate: { type: String },
      timeSlot: { type: String },
      shootArea: { type: String },
      eventType: { type: String },
      extraHourRequested: { type: String },
      calculatedTotalPrice: { type: String },
      planTitle: { type: String },
      bookingDepositPaid: { type: String },
    },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    transactionId: { type: String },
    paymentConfirmedAmount: { type: Number },
    paymentConfirmedAt: { type: Date },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Scheduled", "Editing", "Delivered", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
