import mongoose, { Schema, Document } from "mongoose";

export interface IDeliverable {
  name: string;
  url: string;
  uploadedAt: Date;
}

export interface IProject extends Document {
  title: string;
  clientId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId[]; // ref to User
  status: "Pending" | "Confirmed" | "Scheduled" | "Editing" | "Delivered" | "Completed";
  deadline?: Date;
  deliverables: IDeliverable[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Confirmed", "Scheduled", "Editing", "Delivered", "Completed"],
      default: "Pending",
    },
    deadline: { type: Date },
    deliverables: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
