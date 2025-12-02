
import { Types } from "mongoose";

export interface ISlot {
  hour: number; // 0 to 23
  isAvailable: boolean;
  booking?: Types.ObjectId;
  blockedReason?: string;
}

export interface ICarAvailability {
  car: Types.ObjectId;
  date: Date; // only date part (00:00:00.000Z)
  slots: ISlot[];
  isFullyBlocked?: boolean;
  blockedReason?: string;
}