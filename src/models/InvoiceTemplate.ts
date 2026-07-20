import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceTemplate extends Document {
  templateName: string;
  companyName: string;
  companyAddress: string;
  gstin: string;
  email: string;
  phone: string;
  footerNotes?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceTemplateSchema: Schema = new Schema(
  {
    templateName: { type: String, required: true },
    companyName: { type: String, required: true },
    companyAddress: { type: String, required: true },
    gstin: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    footerNotes: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.InvoiceTemplate ||
  mongoose.model<IInvoiceTemplate>("InvoiceTemplate", InvoiceTemplateSchema);
