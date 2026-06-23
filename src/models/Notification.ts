import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  type: "lead" | "booking" | "payment" | "coupon" | "project";
  title: string;
  message: string;
  isRead: boolean;
  referenceId?: string; // ID of booking, lead, or project
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    type: { type: String, enum: ["lead", "booking", "payment", "coupon", "project"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    referenceId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
