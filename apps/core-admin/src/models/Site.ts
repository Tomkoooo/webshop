import mongoose, { Schema, type Document, type Model } from "mongoose"

/** One registered deployment: replaces the deployments.config.json row as the human-facing inventory. */
export interface ISite extends Document {
  /** Stable id, matches the site app folder name (e.g. `sakkmed`). */
  siteId: string
  label: string
  /** Public base URL of the deployed site, e.g. https://sakkmed.hu */
  baseUrl: string
  templateId: string
  plugins: string[]
  engineVersion?: string
  /** Secret for the site's /api/management surface (MANAGEMENT_API_SECRET on the site). */
  managementSecret?: string
  /** GitHub repository (owner/repo) whose workflow builds this site's image. */
  deployRepo?: string
  /** Workflow file name dispatched for deploys, e.g. docker-publish.yml */
  deployWorkflow?: string
  notes?: string
}

const SiteSchema = new Schema<ISite>(
  {
    siteId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    baseUrl: { type: String, required: true },
    templateId: { type: String, required: true },
    plugins: { type: [String], default: [] },
    engineVersion: { type: String },
    managementSecret: { type: String },
    deployRepo: { type: String },
    deployWorkflow: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

export const Site: Model<ISite> =
  mongoose.models.Site || mongoose.model<ISite>("Site", SiteSchema)
