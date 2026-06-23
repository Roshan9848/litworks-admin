import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  type: "percentage" | "fixed" | "referral";
  value: number; // e.g. 10 for percentage, 500 for fixed
  usageCount: number;
  usageLimit?: number;
  revenueGenerated: number;
  expiryDate?: Date;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ["percentage", "fixed", "referral"], required: true },
    value: { type: Number, required: true },
    usageCount: { type: Number, default: 0 },
    usageLimit: { type: Number },
    revenueGenerated: { type: Number, default: 0 },
    expiryDate: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
