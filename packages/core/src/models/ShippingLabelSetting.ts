import mongoose, { Document, Model, Schema } from "mongoose"

export interface IShippingLabelSetting extends Document {
  key: string
  companyName: string
  companyStreet: string
  companyZip: string
  companyCity: string
  companyCountry: string
  companyPhone: string
  companyEmail: string
  taxNumber: string
  footerNote: string
}

const ShippingLabelSettingSchema = new Schema<IShippingLabelSetting>(
  {
    key: { type: String, required: true, unique: true, default: "shipping-label" },
    companyName: { type: String, default: "" },
    companyStreet: { type: String, default: "" },
    companyZip: { type: String, default: "" },
    companyCity: { type: String, default: "" },
    companyCountry: { type: String, default: "Magyarország" },
    companyPhone: { type: String, default: "" },
    companyEmail: { type: String, default: "" },
    taxNumber: { type: String, default: "" },
    footerNote: { type: String, default: "" },
  },
  { timestamps: true }
)

const ShippingLabelSetting: Model<IShippingLabelSetting> =
  mongoose.models.ShippingLabelSetting ||
  mongoose.model<IShippingLabelSetting>("ShippingLabelSetting", ShippingLabelSettingSchema)

export default ShippingLabelSetting
