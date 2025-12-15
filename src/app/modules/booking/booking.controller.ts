import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { BookingService } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user._id || (req as any).user.id;
  const payload = req.body;

  const result = await BookingService.createBooking(payload, userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully!",
    data: result,
  });
});


/* -------------------- User Bookings -------------------- */
const myBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const status = req.query.status as string;

  const result = await BookingService.getUserBookings(userId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User bookings retrieved successfully",
    data: result,
  });
});

/* -------------------- Host Bookings -------------------- */
const hostBookings = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const status = req.query.status as string;

  const result = await BookingService.getHostBookings(userId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Host bookings retrieved successfully",
    data: result,
  });
});

/* -------------------- Check-in -------------------- */
const checkInController = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;

  const result = await BookingService.checkIn(bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Checked in successfully!",
    data: result,
  });
});

/* -------------------- Check-out -------------------- */
const checkOutController = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;

  const result = await BookingService.checkOut(bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Checked out successfully!",
    data: result,
  });
});

/* -------------------- Cancel Booking -------------------- */
const isCancelledController = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.id;

  const result = await BookingService.isCancelled(bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking cancellation status updated",
    data: { isCancelled: result },
  });
});


// -------- Export as object ----------

export const BookingController = {
  createBooking,
  myBookings,
  hostBookings,
  checkInController,
  checkOutController,
  isCancelledController,
};
