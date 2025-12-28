import { Types } from "mongoose";
import { Booking } from "../booking/booking.model";
import { CAR_STATUS } from "../booking/booking.interface";
import { CarServices } from "./car.service";

export const getCarTripCount = async (
    carId: Types.ObjectId | string
): Promise<number> => {
    const count = await Booking.countDocuments({
        carId: new Types.ObjectId(carId),
        carStatus: CAR_STATUS.COMPLETED,
        isCancelled: { $ne: true },
    });

    return count;
};

// bulk car trip
export const getCarTripCountMap = async (
    carIds: Types.ObjectId[]
): Promise<Record<string, number>> => {
    const result = await Booking.aggregate([
        {
            $match: {
                carId: { $in: carIds },
                carStatus: CAR_STATUS.COMPLETED,
                isCancelled: { $ne: true },
            },
        },
        {
            $group: {
                _id: "$carId",
                count: { $sum: 1 },
            },
        },
    ]);

    const map: Record<string, number> = {};
    for (const item of result) {
        map[item._id.toString()] = item.count;
    }

    return map;
};


// car.utils.ts
export const checkCarAvailabilityByDate = async (car: any, targetDate: Date) => {



    if (!car.isActive) return false;


    const dayName = targetDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase();
    if (car.availableDays?.length && !car.availableDays.includes(dayName)) {
        return false;
    }


    const dateString = targetDate.toISOString().split("T")[0];
    const isBlocked = car.blockedDates?.some(
        (b: any) => new Date(b.date).toISOString().split("T")[0] === dateString
    );
    if (isBlocked) return false;


    const bookingConflict = await Booking.findOne({
        carId: car._id,
        status: { $in: ["PAID", "ONGOING"] },
        fromDate: { $lte: targetDate },
        toDate: { $gte: targetDate },
    });

    return !bookingConflict;
};

export const getCarCalendar = async (carId: string) => {
    const calendar = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateString = targetDate.toISOString().split("T")[0];

        // if any slot is available for that date
        const availability = await CarServices.getAvailability(carId, dateString);


        // if at least `1` slot is available
        const isAnySlotAvailable = availability.slots.some(slot => slot.isAvailable === true);

        calendar.push({
            date: dateString,
            available: isAnySlotAvailable,
            reason: availability.blockedReason || (isAnySlotAvailable ? "" : "Fully Booked"),
        });
    }
    return calendar;
};