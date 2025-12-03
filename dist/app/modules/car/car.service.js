"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarServices = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const user_model_1 = require("../user/user.model");
const car_interface_1 = require("./car.interface");
const car_model_1 = require("./car.model");
const createCarToDB = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: userId, hostStatus: user_1.HOST_STATUS.APPROVED, role: user_1.USER_ROLES.HOST });
    if (!user) {
        throw new ApiErrors_1.default(400, "No user found by this Id");
    }
    ;
    payload.userId = new mongoose_1.Types.ObjectId(userId);
    const result = yield car_model_1.Car.create(payload);
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to create a car");
    }
    ;
    return result;
});
const getAllCarsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield car_model_1.Car.find({ verificationStatus: car_interface_1.CAR_VERIFICATION_STATUS.APPROVED });
    if (!result || result.length === 0) {
        throw new ApiErrors_1.default(404, "No cars are found in the database");
    }
    ;
    return result;
});
const getOwnCarsFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findOne({ _id: userId, role: user_1.USER_ROLES.HOST, hostStatus: user_1.HOST_STATUS.APPROVED });
    if (!user) {
        throw new ApiErrors_1.default(404, "No hosts are found by this ID");
    }
    ;
    const result = yield car_model_1.Car.find();
    if (!result || result.length === 0) {
        return [];
    }
    ;
    return result;
});
const getCarByIdFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield car_model_1.Car.findById(id);
    if (!result) {
        return {};
    }
    ;
    return result;
});
const removeUndefined = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null));
var ACTION;
(function (ACTION) {
    ACTION["ADD"] = "ADD";
    ACTION["DELETE"] = "DELETE";
})(ACTION || (ACTION = {}));
const updateCarByIdToDB = (userId, carId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // -------------------------- Check host --------------------------
    const user = yield user_model_1.User.findOne({
        _id: userId,
        role: user_1.USER_ROLES.HOST,
        hostStatus: user_1.HOST_STATUS.APPROVED,
    });
    if (!user) {
        throw new ApiErrors_1.default(404, "No approved host found by this ID");
    }
    // -------------------------- Handle array actions --------------------------
    let updateQuery = {};
    if (payload.arrayAction) {
        const { field, action, value } = payload.arrayAction;
        if (!["facilities", "images", "availableDays"].includes(field)) {
            throw new ApiErrors_1.default(400, "Invalid array field");
        }
        if (action === ACTION.ADD) {
            updateQuery = { $addToSet: { [field]: value } };
        }
        if (action === ACTION.DELETE) {
            updateQuery = { $pull: { [field]: value } };
        }
        delete payload.arrayAction;
        const updated = yield car_model_1.Car.findOneAndUpdate({ _id: carId, userId }, updateQuery, { new: true });
        return updated;
    }
    // -------------------------- Handle normal updates --------------------------
    const cleanPayload = removeUndefined(payload);
    delete cleanPayload.userId;
    const updated = yield car_model_1.Car.findOneAndUpdate({ _id: carId, userId }, cleanPayload, { new: true });
    return updated;
});
const deleteCarByIdFromDB = (userId, id) => __awaiter(void 0, void 0, void 0, function* () {
    // -------------------------- Check host --------------------------
    const user = yield user_model_1.User.findOne({
        _id: userId,
        role: user_1.USER_ROLES.HOST,
        hostStatus: user_1.HOST_STATUS.APPROVED,
    });
    if (!user) {
        throw new ApiErrors_1.default(404, "No approved host found by this ID");
    }
    const result = yield car_model_1.Car.findByIdAndDelete(id);
    if (!result) {
        throw new ApiErrors_1.default(400, "Failed to delete car by this ID");
    }
    ;
    return result;
});
const getAvailability = (carId, dateString) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const targetDate = new Date(dateString);
    const normalizedDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));
    const car = yield car_model_1.Car.findById(carId).select("isActive availableDays availableHours defaultStartTime defaultEndTime blockedDates");
    if (!car)
        throw new ApiErrors_1.default(404, "Car not found");
    if (!car.isActive)
        return generateBlockedResponse(normalizedDate, "Car is not active");
    // manual block with host reason
    const blockedEntry = (_a = car.blockedDates) === null || _a === void 0 ? void 0 : _a.find((b) => new Date(b.date).toISOString().split("T")[0] === normalizedDate.toISOString().split("T")[0]);
    if (blockedEntry)
        return generateBlockedResponse(normalizedDate, blockedEntry.reason || "Blocked by host");
    // days check
    const dayName = normalizedDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    if (!car.availableDays.includes(dayName)) {
        return generateBlockedResponse(normalizedDate, "Car not available on this day");
    }
    // availableHours string[] → number[] convert
    let openHoursSet = new Set();
    if (car.availableHours && car.availableHours.length > 0) {
        car.availableHours.forEach((timeStr) => {
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
        for (let i = 0; i < 24; i++)
            openHoursSet.add(i);
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
});
// ======================== HELPER FUNCTION ========================
const generateBlockedResponse = (date, reason) => ({
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
const createCarBlockedDatesToDB = (carId, userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure host exists
    const user = yield user_model_1.User.findOne({ _id: userId, role: user_1.USER_ROLES.HOST }).select("_id");
    if (!user)
        throw new ApiErrors_1.default(400, "No user found by this Id");
    // Ensure car belongs to this host
    const car = yield car_model_1.Car.findOne({ _id: carId, userId }).select("blockedDates");
    if (!car)
        throw new ApiErrors_1.default(404, "No car found by this ID");
    // Merge old + new
    const combined = [...(car.blockedDates || []), ...payload];
    // Normalize & remove duplicates by date
    const normalized = Array.from(new Map(combined.map(item => [
        new Date(item.date).toISOString().split("T")[0], // unique key YYYY-MM-DD
        { date: new Date(item.date), reason: item.reason || "" }
    ])).values());
    // Update DB
    const result = yield car_model_1.Car.findByIdAndUpdate(carId, { blockedDates: normalized }, { new: true });
    if (!result)
        throw new ApiErrors_1.default(400, "Failed to update blocked dates");
    return result;
});
exports.CarServices = {
    createCarToDB,
    getAllCarsFromDB,
    getOwnCarsFromDB,
    getCarByIdFromDB,
    updateCarByIdToDB,
    deleteCarByIdFromDB,
    getAvailability,
    createCarBlockedDatesToDB,
};
