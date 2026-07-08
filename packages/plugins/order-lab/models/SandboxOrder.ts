import mongoose, { Schema, Document } from "mongoose";

export type SandboxOrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface ISandboxOrder extends Document {
  orderNumber: string;
  status: SandboxOrderStatus;
  items: {
    productId?: mongoose.Types.ObjectId;
    variantId?: string;
    variantLabel?: string;
    selectedAttributes?: Record<string, string>;
    name: string;
    price: number;
    quantity: number;
    vatPercent?: number;
  }[];
  shippingAddress: {
    name: string;
    zip: string;
    city: string;
    street: string;
    email: string;
    phone: string;
    comment?: string;
  };
  foxpostParcelPoint: {
    id: string;
    name: string;
    address?: string;
    zip?: string;
    city?: string;
    findme?: string;
    load?: string;
  };
  foxpostShipment?: {
    clFoxId?: string;
    refCode?: string;
    labelUrl?: string;
    labelDataBase64?: string;
    labelPageSize?: string;
    trackingStatus?: string;
    generatedAt?: Date;
    generatedBy?: mongoose.Types.ObjectId;
    returnBarcode?: string;
    lastError?: string;
  };
  subtotal: number;
  shippingFee: number;
  total: number;
  notes?: string;
  seededBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SandboxOrderSchema = new Schema<ISandboxOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        variantId: { type: String },
        variantLabel: { type: String },
        selectedAttributes: { type: Schema.Types.Mixed },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        vatPercent: { type: Number, min: 0, max: 100 },
      },
    ],
    shippingAddress: {
      name: { type: String, required: true },
      zip: { type: String, required: true },
      city: { type: String, required: true },
      street: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      comment: { type: String },
    },
    foxpostParcelPoint: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      address: { type: String },
      zip: { type: String },
      city: { type: String },
      findme: { type: String },
      load: { type: String },
    },
    foxpostShipment: {
      clFoxId: { type: String, index: true },
      refCode: { type: String },
      labelUrl: { type: String },
      labelDataBase64: { type: String },
      labelPageSize: { type: String },
      trackingStatus: { type: String },
      generatedAt: { type: Date },
      generatedBy: { type: Schema.Types.ObjectId, ref: "User" },
      returnBarcode: { type: String },
      lastError: { type: String },
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String },
    seededBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "sandbox_orders" }
);

SandboxOrderSchema.index({ createdAt: -1 });

const SandboxOrder =
  mongoose.models.SandboxOrder ||
  mongoose.model<ISandboxOrder>("SandboxOrder", SandboxOrderSchema);

export default SandboxOrder;
