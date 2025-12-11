import { model, Schema, Model, Types } from "mongoose";
import { IBooking, BOOKING_STATUS, Driver_STATUS } from "./booking.interface";

 

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
  type: { type: String, enum: Driver_STATUS, required: false },  
  },
  { timestamps: true, versionKey: false }
);


// Indexes
bookingSchema.index({ userId: 1 });
bookingSchema.index({ hostId: 1 });
bookingSchema.index({ carId: 1 });

export const Booking: Model<IBooking> = model<IBooking>(
  "Booking",
  bookingSchema
);
