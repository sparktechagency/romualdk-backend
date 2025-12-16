import mongoose, { Document, Schema, Types } from "mongoose";

export enum TransactionStatus {
  PENDING = "pending",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELED = "canceled",
}

// export enum PaymentProvider {
//   CINETPAY = "cinetpay",
//   STRIPE = "stripe",
//   OTHER = "other",
// }

export enum PaymentMethod { CARD = "card", }

export interface ITransaction extends Document {
  bookingId: Types.ObjectId | string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: TransactionStatus;
  externalRef?: string;
  // provider?: PaymentProvider;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
<<<<<<< Updated upstream
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
=======
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
>>>>>>> Stashed changes
    amount: { type: Number, required: true },
    currency: { type: String, default: "xof" },
    method: { type: String, enum: Object.values(PaymentMethod), default:  PaymentMethod.CARD },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    externalRef: { type: String },
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
  },
  { timestamps: true },
);

<<<<<<< Updated upstream
export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;

=======
export const Transaction = mongoose.model("Transaction", transactionSchema);
>>>>>>> Stashed changes
