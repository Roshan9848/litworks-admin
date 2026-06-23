import mongoose, { Schema, Document } from "mongoose";

export interface IClient extends Document {
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  sourceLeadId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String },
    sourceLeadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);
