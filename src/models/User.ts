import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: "FOUNDER" | "CO-FOUNDER" | "MANAGER" | "EDITOR" | "PHOTOGRAPHER" | "VIDEOGRAPHER" | "INTERN";
  phone?: string;
  status: "active" | "inactive";
  otp?: string;
  otpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["FOUNDER", "CO-FOUNDER", "MANAGER", "EDITOR", "PHOTOGRAPHER", "VIDEOGRAPHER", "INTERN"],
      default: "MANAGER",
    },
    phone: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
