import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentMethod extends Document {
  name: string;
  grossPrice: number;
  isActive: boolean;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: { type: String, required: true },
    grossPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PaymentMethod: Model<IPaymentMethod> = 
  mongoose.models.PaymentMethod || mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
