import { Request, Response } from "express";
import { BookingService } from "./booking.service";

const create = async (req: Request, res: Response) => {
  try {
    console.log("Body:", req.body);

    const userId = (req as any).user._id || (req as any).user.id;
    const booking = await BookingService.createBooking(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Booking created successfully!",
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const myBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const bookings = await BookingService.getUserBookings(userId);

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const hostBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const bookings = await BookingService.getHostBookings(userId);

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const BookingController = {
  create,
  myBookings,
  hostBookings,
};
