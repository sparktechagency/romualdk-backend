import { Types } from "mongoose";

export enum BOOKING_STATUS {
  PENDING = "pending",
  PAID = "paid",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum Driver_STATUS {
  WITHDRIVER = "withDriver",
  WITHOUTDRIVER = "withoutDriver",
}

export interface IBooking {
  _id: Types.ObjectId;
  carId: Types.ObjectId;
  userId: Types.ObjectId;
  hostId: Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  totalAmount: number;
  status: BOOKING_STATUS;
  type?: Driver_STATUS;
  createdAt: string;
  updatedAt: string;
}
