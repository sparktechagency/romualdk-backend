import { Booking } from "./booking.model";
import { Car } from "../car/car.model";
import { BOOKING_STATUS, CAR_STATUS, Driver_STATUS } from "./booking.interface";
import { calculatePrice } from "../../../util/bookingCalculation";
import { getCarTripCountMap } from "../car/car.utils";
import { Types } from "mongoose";
import { ReviewServices } from "../review/review.service";
import { REVIEW_TYPE } from "../review/review.interface";

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

/*
1. ai agent build korte hobe, arpor nijer eccomerce business run korte hobe
2. ai agent build korte hobe, page a integrate korte hobe, abong ai agent sell korte hobe
*/

// -------- Get user bookings ----------

// const getUserBookings = async (userId: string, status?: string) => {
//   const filter: any = { userId };

//   if (status) filter.carStatus = status;

//   return Booking.find(filter)
//     .populate("carId")
//     .populate("hostId")
//     .populate("transactionId")
//     .sort({ createdAt: -1 });
// };

// =======================MOSHFIQUR RAHMAN====================
const getUserBookings = async (userId: string, status?: string) => {
  const filter: any = { userId };

  if (status) filter.carStatus = status;

  // ---------- STEP 1: Fetch bookings ----------
  const bookings = await Booking.find(filter)
    .populate("carId")
    .populate("hostId")
    .populate("transactionId")
    .sort({ createdAt: -1 })
    .lean();

  if (!bookings.length) return bookings;

  // ---------- STEP 2: Extract carIds ----------
  const carIds = bookings
    .map((booking: any) => booking.carId?._id)
    .filter(Boolean)
    .map((id: any) => new Types.ObjectId(id));

  // ---------- STEP 3: Trip count ----------
  const tripCountMap = await getCarTripCountMap(carIds);

  // ---------- STEP 4: Attach trips + rating ----------
  const finalBookings = await Promise.all(
    bookings.map(async (booking: any) => {
      const carId = booking.carId?._id?.toString();

      const reviewSummary =
        await ReviewServices.getReviewSummaryFromDB(
          carId,
          REVIEW_TYPE.CAR
        );

      return {
        ...booking,
        carId: {
          ...booking.carId,
          trips: tripCountMap[carId] || 0,
          averageRating: reviewSummary.averageRating,
          totalReviews: reviewSummary.totalReviews,
          starCounts: reviewSummary.starCounts,
          reviews: reviewSummary.reviews,
        },
      };
    })
  );

  return finalBookings;
};

// =======================MOSHFIQUR RAHMAN====================

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
