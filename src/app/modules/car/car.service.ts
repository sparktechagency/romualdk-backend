import { Types } from "mongoose";
import { HOST_STATUS, USER_ROLES } from "../../../enums/user"
import ApiError from "../../../errors/ApiErrors";
import { User } from "../user/user.model"
import { AVAILABLE_DAYS, CAR_VERIFICATION_STATUS, IBlockedDate, ICar } from "./car.interface";
import { Car } from "./car.model";
import QueryBuilder from "../../builder/queryBuilder";
import { FavouriteCar } from "../favouriteCar/favouriteCar.model";
import { ReviewServices } from "../review/review.service";
import { REVIEW_TYPE } from "../review/review.interface";

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

// for feed 
const getAllCarsFromDB = async (query: any, userId: string) => {

  const baseQuery = Car.find({ verificationStatus: CAR_VERIFICATION_STATUS.APPROVED }).populate({ path: "userId", select: "firstName lastName fullName role profileImage email phone" });


  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(["brand", "model", "transmission", "color", "city", "licensePlate"])
    .sort()
    .fields()
    .filter()
    .paginate();


  const cars = await queryBuilder.modelQuery;

  const carsWithBookmark = await Promise.all(
    cars.map(async (car: any) => {
      const isBookmarked = await FavouriteCar.exists({
        userId,
        referenceId: car._id,
      });

      const reviewSummary = await ReviewServices.getReviewSummaryFromDB(car.id, REVIEW_TYPE.CAR)

      return {
        ...car.toObject(),
        isFavourite: Boolean(isBookmarked),
        averageRating: reviewSummary.averageRating,
        totalReviews: reviewSummary.totalReviews,
        starCounts: reviewSummary.starCounts,
        reviews: reviewSummary.reviews,
      };
    })
  );



  const meta = await queryBuilder.countTotal();

  if (!cars || cars.length === 0) {
    throw new ApiError(404, "No cars are found in the database")
  };

  return {
    data: carsWithBookmark,
    meta,
  }
}

// for verifications, dashboard
const getAllCarsForVerificationsFromDB = async (query: any) => {

  const baseQuery = Car.find({
    verificationStatus: { $in: [CAR_VERIFICATION_STATUS.PENDING, CAR_VERIFICATION_STATUS.REJECTED, CAR_VERIFICATION_STATUS.APPROVED] }
  }).populate({ path: "userId", select: "firstName lastName fullName role email phone profileImage" });

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .search(["brand", "model", "transmission", "color", "city", "licensePlate"])
    .sort()
    .fields()
    .filter()
    .paginate();

  const cars = await queryBuilder.modelQuery;

  const meta = await queryBuilder.countTotal();


  if (!cars || cars.length === 0) {
    throw new ApiError(404, "No cars are found in the database")
  };

  return {
    data: cars,
    meta,
  }
}

const updateCarVerificationStatusByIdToDB = async (carId: string, carVerificationStatus: CAR_VERIFICATION_STATUS.APPROVED | CAR_VERIFICATION_STATUS.PENDING | CAR_VERIFICATION_STATUS.REJECTED) => {

  if (![CAR_VERIFICATION_STATUS.PENDING, CAR_VERIFICATION_STATUS.APPROVED, CAR_VERIFICATION_STATUS.REJECTED].includes(carVerificationStatus)) {
    throw new ApiError(400, "Car verification status must be either 'PENDING','APPROVED' or 'REJECTED'");
  }
  console.log(carVerificationStatus, "STATUS")

  const result = await Car.findByIdAndUpdate(carId, { verificationStatus: carVerificationStatus }, { new: true });

  if (!result) {
    throw new ApiError(400, "Failed to change car verification status by this car ID");
  }

  return result;

}

// for host role
const getOwnCarsFromDB = async (userId: string) => {
  const user = await User.findOne({ _id: userId, role: USER_ROLES.HOST, hostStatus: HOST_STATUS.APPROVED })

  if (!user) {
    throw new ApiError(404, "No hosts are found by this ID")
  };

  const result = await Car.find({ userId }).populate({ path: "userId", select: "firstName lastName fullName role profileImage email phone" });

  const carsWithBookmark = await Promise.all(
    result.map(async (car: any) => {
      const isBookmarked = await FavouriteCar.exists({
        userId,
        referenceId: car._id,
      });

      const reviewSummary = await ReviewServices.getReviewSummaryFromDB(car.id, REVIEW_TYPE.CAR)


      return {
        ...car.toObject(),
        isFavourite: Boolean(isBookmarked),
        averageRating: reviewSummary.averageRating,
        totalReviews: reviewSummary.totalReviews,
        starCounts: reviewSummary.starCounts,
        reviews: reviewSummary.reviews,
      };
    })
  );

  if (!result || result.length === 0) {
    return []
  };

  return carsWithBookmark;

}

const getCarByIdFromDB = async (id: string, userId: string) => {
  const result = await Car.findById(id).populate({ path: "userId", select: "firstName lastName fullName role profileImage email phone" });

  const isBookmarked = await FavouriteCar.exists({
    userId,
    referenceId: id,
  });

  const reviewSummary = await ReviewServices.getReviewSummaryFromDB(id, REVIEW_TYPE.CAR)


  if (!result) {
    return {}
  };

  return {
    ...result.toObject(),
    isFavourite: Boolean(isBookmarked),
    averageRating: reviewSummary.averageRating,
    totalReviews: reviewSummary.totalReviews,
    starCounts: reviewSummary.starCounts,
    reviews: reviewSummary.reviews,
  };;

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
    "isActive availableDays availableHours defaultStartTime defaultEndTime blockedDates"
  );

  if (!car) throw new ApiError(404, "Car not found");
  if (!car.isActive) return generateBlockedResponse(normalizedDate, "Car is not active");

  // manual block with host reason
  const blockedEntry = car.blockedDates?.find((b: any) =>
    new Date(b.date).toISOString().split("T")[0] === normalizedDate.toISOString().split("T")[0]
  );
  if (blockedEntry) return generateBlockedResponse(normalizedDate, blockedEntry.reason || "Blocked by host");

  // days check
  const dayName = normalizedDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase() as AVAILABLE_DAYS;
  if (!car.availableDays.includes(dayName)) {
    return generateBlockedResponse(normalizedDate, "Car not available on this day");
  }

  // availableHours string[] → number[] convert
  let openHoursSet = new Set<number>();

  if (car.availableHours && car.availableHours.length > 0) {
    car.availableHours.forEach((timeStr: string) => {
      const hour = parseInt(timeStr.split(":")[0], 10);
      if (!isNaN(hour) && hour >= 0 && hour <= 23) {
        openHoursSet.add(hour);
      }
    });
  }
  // defaultStartTime/endTime
  else if (car.defaultStartTime && car.defaultEndTime) {
    const start = parseInt(car.defaultStartTime.split(":")[0], 10);
    let end = parseInt(car.defaultEndTime.split(":")[0], 10);
    const endHour = end === 0 ? 24 : end;

    for (let h = start; h < endHour; h++) {
      openHoursSet.add(h % 24);
    }
  }
  // fallback 24 hour slots
  else {
    for (let i = 0; i < 24; i++) openHoursSet.add(i);
  }

  // final slots
  const slots = Array.from({ length: 24 }, (_, hour) => {
    const isAvailable = openHoursSet.has(hour);
    return {
      hour,
      time: `${String(hour).padStart(2, "0")}:00`,
      isAvailable,
      blocked: !isAvailable,
      blockedReason: isAvailable ? null : "Outside operating hours",
    };
  });

  return {
    date: normalizedDate.toISOString().split("T")[0],
    isFullyBlocked: false,
    blockedReason: null,
    slots,
  };
};

// ======================== HELPER FUNCTION ========================
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

const createCarBlockedDatesToDB = async (
  carId: string,
  userId: string,
  payload: IBlockedDate[]
) => {
  // Ensure host exists
  const user = await User.findOne({ _id: userId, role: USER_ROLES.HOST }).select("_id");
  if (!user) throw new ApiError(400, "No user found by this Id");

  // Ensure car belongs to this host
  const car = await Car.findOne({ _id: carId, userId }).select("blockedDates");
  if (!car) throw new ApiError(404, "No car found by this ID");

  // Merge old + new
  const combined = [...(car.blockedDates || []), ...payload];

  // Normalize & remove duplicates by date
  const normalized = Array.from(
    new Map(
      combined.map(item => [
        new Date(item.date).toISOString().split("T")[0], // unique key YYYY-MM-DD
        { date: new Date(item.date), reason: item.reason || "" }
      ])
    ).values()
  );

  // Update DB
  const result = await Car.findByIdAndUpdate(
    carId,
    { blockedDates: normalized },
    { new: true }
  );

  if (!result) throw new ApiError(400, "Failed to update blocked dates");

  return result;
};


export const CarServices = {
  createCarToDB,
  getAllCarsFromDB,
  getOwnCarsFromDB,
  getCarByIdFromDB,
  updateCarByIdToDB,
  deleteCarByIdFromDB,
  getAvailability,
  createCarBlockedDatesToDB,
  getAllCarsForVerificationsFromDB,
  updateCarVerificationStatusByIdToDB,
}