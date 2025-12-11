// import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  method: string;
  status: "pending" | "paid" | "failed";
  externalRef?: string;
  provider: "cinetpay";
  createdAt: Date;
  updatedAt: Date;
}
 

import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "xof" },
    method: { type: String, default: "card" },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "canceled"],
      default: "pending",
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);

