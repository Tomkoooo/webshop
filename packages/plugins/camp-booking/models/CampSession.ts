import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ICampSession extends Document {
  campId: Types.ObjectId
  label: string
  startDate: Date
  endDate: Date
  capacity: number
  soldCount: number
  reservedCount: number
  isPublished: boolean
  imageUrl?: string
}

const CampSessionSchema = new Schema<ICampSession>(
  {
    campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true, index: true },
    label: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, required: true, default: 0, min: 0 },
    reservedCount: { type: Number, required: true, default: 0, min: 0 },
    isPublished: { type: Boolean, default: false },
    imageUrl: { type: String },
  },
  { timestamps: true }
)

CampSessionSchema.index({ campId: 1, startDate: 1 })

const CampSession: Model<ICampSession> =
  mongoose.models.CampSession ||
  mongoose.model<ICampSession>("CampSession", CampSessionSchema)

export default CampSession
