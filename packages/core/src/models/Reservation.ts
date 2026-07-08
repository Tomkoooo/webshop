import mongoose, { Schema, Document, Model } from "mongoose";

export type ReservationState = "pending" | "confirmed" | "released" | "expired";

export interface IReservation extends Document {
  tempOrder: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variantId?: string;
  quantity: number;
  promoQuantity?: number;
  promoUnitPrice?: number;
  regularUnitPrice?: number;
  state: ReservationState;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    tempOrder: { type: Schema.Types.ObjectId, ref: "TempOrder", required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    variantId: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    promoQuantity: { type: Number, default: 0, min: 0 },
    promoUnitPrice: { type: Number },
    regularUnitPrice: { type: Number },
    state: {
      type: String,
      enum: ["pending", "confirmed", "released", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

ReservationSchema.index({ state: 1, expiresAt: 1 });
ReservationSchema.index({ tempOrder: 1, state: 1 });

const Reservation: Model<IReservation> =
  mongoose.models.Reservation || mongoose.model<IReservation>("Reservation", ReservationSchema);

export default Reservation;
