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

export const CarServices = {
    createCarToDB,
    getAllCarsFromDB,
    getOwnCarsFromDB,
    getCarByIdFromDB,
    updateCarByIdToDB,
    deleteCarByIdFromDB,
}