import { Booking } from "./booking.model";
import { Car } from "../car/car.model";
import { BOOKING_STATUS, Driver_STATUS } from "./booking.interface";
import { Types } from "mongoose";

// -------- Price Calculation ----------
const calculatePrice = (fromDate: string, toDate: string, type: string) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  const days =
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  const baseRate = 120;
  const driverFee = type === "withDriver" ? 125 : 0;

  return days * baseRate + driverFee;
};

// -------- Create Booking ----------
const createBooking = async (body: any, userId: string) => {
  const { carId, fromDate, toDate, type } = body;
  console.log(body);

  const car = await Car.findById(carId);
  if (!car) throw new Error("Car not found");

  const totalAmount = calculatePrice(fromDate, toDate, type);

  const booking = await Booking.create({
    carId: new Types.ObjectId(carId),
    userId: new Types.ObjectId(userId),
    hostId: new Types.ObjectId(car.userId),
    fromDate: new Date(fromDate),
    toDate: new Date(toDate),
    totalAmount,
    status: BOOKING_STATUS.PENDING,
    type: type || Driver_STATUS.WITHOUTDRIVER,
  });

  //   return booking.populate([
  //     { path: "carId" },
  //     { path: "userId" },
  //     { path: "hostId" },
  //   ]);
  return booking;
};

// -------- Get user bookings ----------
const getUserBookings = async (userId: string) => {
  return Booking.find({ userId })
  .sort({ createdAt: -1 });
};

// -------- Get host bookings ----------
const getHostBookings = async (hostId: string) => {
  return Booking.find({ hostId })
    .populate("carId")
    .populate("userId")
    .sort({ createdAt: -1 });
};

// -------- Export as object ----------
export const BookingService = {
  createBooking,
  getUserBookings,
  getHostBookings,
};
