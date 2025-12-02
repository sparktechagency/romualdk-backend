import { Types } from "mongoose";
import { HOST_STATUS, USER_ROLES } from "../../../enums/user"
import ApiError from "../../../errors/ApiErrors";
import { User } from "../user/user.model"
import { ICar } from "./car.interface";
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
    const result = await Car.find();
    if (!result || result.length === 0) {
        throw new ApiError(404, "No cars are found in the database")
    };

    return result;
}

export const CarServices = {
    createCarToDB,
    getAllCarsFromDB,
}