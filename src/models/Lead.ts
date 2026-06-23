import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  name: string;
  phone: string;
  email: string;
  businessName?: string;
  service: string;
  source: string; // e.g. Website Booking Form, Website Contact, Manual Input
  notes?: string;
  status: "New" | "Contacted" | "Interested" | "Proposal Sent" | "Won" | "Lost";
  convertedToClientId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    businessName: { type: String },
    service: { type: String, required: true },
    source: { type: String, default: "Website" },
    notes: { type: String },
    status: {
      type: String,
      enum: ["New", "Contacted", "Interested", "Proposal Sent", "Won", "Lost"],
      default: "New",
    },
    convertedToClientId: { type: Schema.Types.ObjectId, ref: "Client" },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
