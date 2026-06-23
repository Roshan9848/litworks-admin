import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  transactionId: string;
  clientId?: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  packageName?: string;
  amount: number; // total amount paid
  gst: number; // gst amount included
  status: "captured" | "failed" | "pending" | "refunded";
  gateway: "Cashfree" | "Razorpay";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    packageName: { type: String },
    amount: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["captured", "failed", "pending", "refunded"],
      required: true,
      default: "pending",
    },
    gateway: { type: String, enum: ["Cashfree", "Razorpay"], default: "Cashfree" },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
