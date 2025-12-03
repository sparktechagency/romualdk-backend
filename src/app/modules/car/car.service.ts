import { Types } from "mongoose";
import { HOST_STATUS, USER_ROLES } from "../../../enums/user"
import ApiError from "../../../errors/ApiErrors";
import { User } from "../user/user.model"
import { CAR_VERIFICATION_STATUS, ICar } from "./car.interface";
import { Car } from "./car.model";

const createCarToDB = async (userId: string, payload: ICar) => {
    const user = await User.findOne({ _id: userId, hostStatus: HOST_STATUS.APPROVED, role: USER_ROLES.HOST });

    if (!user) {
        throw new ApiError(400, "No user found by this Id")
    };

    payload.userId = new Types.ObjectId(userId);

    const result = await Car.create(payload);

    if (!result) {
        throw new ApiError(400, "Failed to create a car")
    };

    return result;

}

const getAllCarsFromDB = async () => {
    const result = await Car.find({ verificationStatus: CAR_VERIFICATION_STATUS.APPROVED });

    if (!result || result.length === 0) {
        throw new ApiError(404, "No cars are found in the database")
    };

    return result;
}

const getOwnCarsFromDB = async (userId: string) => {
    const user = await User.findOne({ _id: userId, role: USER_ROLES.HOST, hostStatus: HOST_STATUS.APPROVED });

    if (!user) {
        throw new ApiError(404, "No hosts are found by this ID")
    };

    const result = await Car.find();

    if (!result || result.length === 0) {
        return []
    };

    return result;

}

const getCarByIdFromDB = async (id: string) => {
    const result = await Car.findById(id);

    if (!result) {
        return {}
    };

    return result;

}

const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
    ) as Partial<T>;

enum ACTION {
    ADD = "ADD",
    DELETE = "DELETE"
}

interface IArrayAction {
    field: string;            // e.g. "facilities"
    action: ACTION // add/remove
    value: string;            // single item
}

const updateCarByIdToDB = async (
    userId: string,
    carId: string,
    payload: Partial<ICar> & { arrayAction?: IArrayAction }
) => {
    // -------------------------- Check host --------------------------
    const user = await User.findOne({
        _id: userId,
        role: USER_ROLES.HOST,
        hostStatus: HOST_STATUS.APPROVED,
    });

    if (!user) {
        throw new ApiError(404, "No approved host found by this ID");
    }

    // -------------------------- Handle array actions --------------------------
    let updateQuery: any = {};

    if (payload.arrayAction) {
        const { field, action, value } = payload.arrayAction;

        if (!["facilities", "images", "availableDays"].includes(field)) {
            throw new ApiError(400, "Invalid array field");
        }

        if (action === ACTION.ADD) {
            updateQuery = { $addToSet: { [field]: value } };
        }

        if (action === ACTION.DELETE) {
            updateQuery = { $pull: { [field]: value } };
        }


        delete payload.arrayAction;

        const updated = await Car.findOneAndUpdate(
            { _id: carId, userId },
            updateQuery,
            { new: true }
        );

        return updated;
    }

    // -------------------------- Handle normal updates --------------------------
    const cleanPayload = removeUndefined(payload);


    delete (cleanPayload as any).userId;

    const updated = await Car.findOneAndUpdate(
        { _id: carId, userId },
        cleanPayload,
        { new: true }
    );

    return updated;
};

const deleteCarByIdFromDB = async (userId: string, id: string) => {
    // -------------------------- Check host --------------------------
    const user = await User.findOne({
        _id: userId,
        role: USER_ROLES.HOST,
        hostStatus: HOST_STATUS.APPROVED,
    });

    if (!user) {
        throw new ApiError(404, "No approved host found by this ID");
    }

    const result = await Car.findByIdAndDelete(id);

    if (!result) {
        throw new ApiError(400, "Failed to delete car by this ID")
    };

    return result;
}

const getAvailability = async (carId: string, dateString: string) => {
  const targetDate = new Date(dateString);
  const normalizedDate = new Date(
    Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
  );

  const car = await Car.findById(carId).select(
    "isActive availableDays defaultStartTime defaultEndTime blockedDates"
  );

  if (!car) throw new ApiError(404, "Car not found");
  if (!car.isActive) {
    return generateBlockedResponse(normalizedDate, "Car is not active");
  }

  // check if host block manually
  const isManuallyBlocked = car.blockedDates?.some(blocked => {
    const blockedDate = new Date(blocked.date);
    return blockedDate.toISOString().split("T")[0] === normalizedDate.toISOString().split("T")[0];
  });

  if (isManuallyBlocked) {
    return generateBlockedResponse(normalizedDate, "Blocked by host");
  }

  // check if available
  const dayName = normalizedDate
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase(); // "FRIDAY"

  const isDayAvailable = car.availableDays.some(
    (day: string) => day.toUpperCase() === dayName
  );

  if (!isDayAvailable) {
    return generateBlockedResponse(normalizedDate, "Car not available on this day");
  }

  // 3. Operating hours
  const startHour = car.defaultStartTime
    ? parseInt(car.defaultStartTime.split(":")[0], 10)
    : 0;

  const endHour = car.defaultEndTime
    ? parseInt(car.defaultEndTime.split(":")[0], 10)
    : 23;

  // 4. Final slots
  const slots = Array.from({ length: 24 }, (_, hour) => {
    const withinOperatingHours = hour >= startHour && hour < endHour;

    return {
      hour,
      time: `${String(hour).padStart(2, "0")}:00`,
      isAvailable: withinOperatingHours,
      blocked: !withinOperatingHours,
      blockedReason: withinOperatingHours ? null : "Outside operating hours",
    };
  });

  return {
    date: normalizedDate.toISOString().split("T")[0],
    isFullyBlocked: false,
    blockedReason: null,
    slots,
  };
};

// Helper function
const generateBlockedResponse = (date: Date, reason: string) => ({
  date: date.toISOString().split("T")[0],
  isFullyBlocked: true,
  blockedReason: reason,
  slots: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    time: `${String(hour).padStart(2, "0")}:00`,
    isAvailable: false,
    blocked: true,
    blockedReason: reason,
  })),
});

export const CarServices = {
    createCarToDB,
    getAllCarsFromDB,
    getOwnCarsFromDB,
    getCarByIdFromDB,
    updateCarByIdToDB,
    deleteCarByIdFromDB,
    getAvailability,
}