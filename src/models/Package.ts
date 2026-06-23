import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  title: string;
  price: number; // e.g. 1999
  discountPrice?: number; // e.g. 1799
  description: string;
  features: string[];
  serviceType: string; // e.g. "Instant Reel", "Wedding Instant Reel"
  isBestseller: boolean;
  category: "basic" | "wedding";
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    description: { type: String, required: true },
    features: [{ type: String }],
    serviceType: { type: String, required: true },
    isBestseller: { type: Boolean, default: false },
    category: { type: String, enum: ["basic", "wedding"], required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);
