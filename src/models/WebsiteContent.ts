import mongoose, { Schema, Document } from "mongoose";

export interface IWebsiteContent extends Document {
  sectionKey: string; // e.g. "hero", "faq", "testimonials", "stats", "contact", "footer"
  content: any; // Dynamic JSON content specific to the section
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteContentSchema: Schema = new Schema(
  {
    sectionKey: { type: String, required: true, unique: true, index: true },
    content: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.WebsiteContent || mongoose.model<IWebsiteContent>("WebsiteContent", WebsiteContentSchema);
