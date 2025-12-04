import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    externalRef: String,
    provider: { type: String, enum: ["cinetpay"], default: "cinetpay" },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
