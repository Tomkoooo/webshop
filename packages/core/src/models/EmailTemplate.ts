import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailTemplate extends Document {
  type: string;
  subject: string;
  body: string;
  description: string;
  variables: string[]; // List of available variables for this template
  /** e.g. shop, contact, camp-booking — shown in admin for filtering */
  tags: string[];
  /** null = core engine; otherwise owning plugin id */
  pluginId: string | null;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    type: { type: String, required: true, unique: true }, // e.g., 'order_confirmation'
    subject: { type: String, required: true },
    body: { type: String, required: true },
    description: { type: String },
    variables: [{ type: String }],
    tags: { type: [String], default: [] },
    pluginId: { type: String, default: null },
  },
  { timestamps: true }
);

const EmailTemplate: Model<IEmailTemplate> = 
  mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;
