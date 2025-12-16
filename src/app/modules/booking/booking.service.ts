import { Booking } from "./booking.model";
import { Car } from "../car/car.model";
import { BOOKING_STATUS, CAR_STATUS, Driver_STATUS } from "./booking.interface";
import { calculatePrice } from "../../../util/bookingCalculation";

// -------- Create Booking ----------
const createBooking = async (body: any, userId: string) => {
  const { carId, fromDate, toDate, type } = body;
  const car = await Car.findById(carId);
  if (!car) throw new Error("Car not found");
  const dayHour = calculatePrice(fromDate, toDate);
  const dailyPrice = car.dailyPrice ?? 0;
  const hourlyPrice = car.hourlyPrice ?? 0;
  const totalAmount = dayHour.days * dailyPrice + dayHour.hours * hourlyPrice;

  const booking = await Booking.create({
    carId,
    userId,
    hostId: car.userId,
    fromDate: new Date(fromDate),
    toDate: new Date(toDate),
    totalAmount,
    status: BOOKING_STATUS.PENDING,
    type: type || Driver_STATUS.WITHOUTDRIVER,
  });

  return booking;
};

// -------- Get user bookings ----------
<<<<<<< Updated upstream
=======
const getUserBookings = async (userId: string) => {
  return Booking.find({ userId }).sort({ createdAt: -1 });
};
>>>>>>> Stashed changes

const getUserBookings = async (userId: string, status?: string) => {
  const filter: any = { userId };

  if (status) filter.carStatus = status;

  return Booking.find(filter)
    .populate("carId")
    .populate("hostId")
    .populate("transactionId")
    .sort({ createdAt: -1 });
};

// -------- Get host bookings ----------
const getHostBookings = async (hostId: string, status?: string) => {
  const filter: any = { hostId };

  if (status) filter.carStatus = status;
  return Booking.find(filter)
    .populate("carId")
    .populate("userId")
    .populate("transactionId")
    .sort({ createdAt: -1 });
};

const checkIn = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (booking.status !== BOOKING_STATUS.PAID)
    throw new Error("Payment required");

  if (booking.checkIn) throw new Error("Already checked in");

  booking.checkIn = true;
  if (
    booking.status === BOOKING_STATUS.PAID &&
    booking.checkIn &&
    !booking.checkOut
  ) {
    booking.carStatus = CAR_STATUS.ONGOING;
  }
  return booking.save();
};

const checkOut = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (!booking.checkIn) throw new Error("Cannot check-out before check-in");
  if (booking.checkOut) throw new Error("Already checked out");

  booking.checkOut = true;
  if (
    booking.status === BOOKING_STATUS.PAID &&
    booking.checkIn &&
    booking.checkOut
  ) {
    booking.carStatus = CAR_STATUS.COMPLETED;
  }
  return booking.save();
};

const isCancelled = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  if (
    // booking.status === BOOKING_STATUS.PAID &&
    !booking.checkIn &&
    !booking.checkOut &&
    !booking.isCancelled
  ) {
    booking.isCancelled = true;
    booking.carStatus = CAR_STATUS.CANCELLED;
  } else {
    throw new Error("Cannot cancel this booking");
  }

  return booking.save();
};
// -------- Export as object ----------
export const BookingService = {
  createBooking,
  getUserBookings,
  getHostBookings,
  checkIn,
  checkOut,
  isCancelled,
};
