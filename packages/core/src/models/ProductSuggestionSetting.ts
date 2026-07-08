import mongoose, { Schema, Document, Model } from "mongoose"

export interface IProductSuggestionSetting extends Document {
  key: string
  enabled: boolean
  showCartLinesInModal?: boolean
  modalTitle?: string
  modalHelper?: string
  maxSuggestions: number
  /** Validated with Zod in ProductSuggestionSettingsService — array of source rule objects */
  sources: unknown[]
}

const ProductSuggestionSettingSchema = new Schema<IProductSuggestionSetting>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    enabled: { type: Boolean, default: false },
    showCartLinesInModal: { type: Boolean, default: false },
    modalTitle: { type: String },
    modalHelper: { type: String },
    maxSuggestions: { type: Number, default: 6 },
    sources: { type: Array, of: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
)

const ProductSuggestionSetting: Model<IProductSuggestionSetting> =
  mongoose.models.ProductSuggestionSetting ||
  mongoose.model<IProductSuggestionSetting>("ProductSuggestionSetting", ProductSuggestionSettingSchema)

export default ProductSuggestionSetting
