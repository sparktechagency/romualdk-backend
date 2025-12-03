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
exports.FavouriteCarServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const favouriteCar_model_1 = require("./favouriteCar.model");
const checkFavouriteCarStatus = (userId, referenceId) => __awaiter(void 0, void 0, void 0, function* () {
    const favourite = yield favouriteCar_model_1.FavouriteCar.findOne({ userId, referenceId });
    return { isFavourite: !!favourite };
});
const toggleFavourite = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, referenceId } = payload;
    const existing = yield favouriteCar_model_1.FavouriteCar.findOne({ userId, referenceId });
    if (existing) {
        yield favouriteCar_model_1.FavouriteCar.deleteOne({ _id: existing._id });
        return { message: "Favourite removed successfully", isFavourite: false };
    }
    const newFavourite = yield favouriteCar_model_1.FavouriteCar.create({
        userId,
        referenceId: new mongoose_1.default.Types.ObjectId(referenceId),
    });
    return {
        message: "Favourite added successfully",
        isFavourite: true,
        data: newFavourite,
    };
});
const getFavourite = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const favourites = yield favouriteCar_model_1.FavouriteCar.find({ userId })
        .populate({
        path: "referenceId",
        populate: [
            { path: "user", select: "firstName lastName role email profileImage" },
            { path: "category", select: "name" },
        ],
    })
        .lean();
    const result = favourites.map((favourite) => {
        const car = favourite.referenceId;
        return {
            favouriteId: favourite._id,
            isFavourite: true,
            car: {
                _id: car === null || car === void 0 ? void 0 : car._id,
                title: car === null || car === void 0 ? void 0 : car.title,
                images: car === null || car === void 0 ? void 0 : car.images,
                pricePerDay: car === null || car === void 0 ? void 0 : car.pricePerDay,
                location: car === null || car === void 0 ? void 0 : car.location,
                year: car === null || car === void 0 ? void 0 : car.year,
                brand: car === null || car === void 0 ? void 0 : car.brand,
                userId: (car === null || car === void 0 ? void 0 : car.userId)
                    ? {
                        _id: car.userId._id,
                        name: car.userId.name,
                        profileImage: car.userId.profileImage,
                    }
                    : null,
                category: car === null || car === void 0 ? void 0 : car.category,
            }
        };
    });
    return result;
});
const getSingleFavourite = (userId, favouriteId) => __awaiter(void 0, void 0, void 0, function* () {
    const favourite = yield favouriteCar_model_1.FavouriteCar.findOne({
        _id: favouriteId,
        userId,
    })
        .populate({
        path: "referenceId",
        populate: [
            { path: "user", select: "firstName lastName role email profileImage" },
            { path: "category", select: "name" },
        ],
    })
        .lean();
    if (!favourite) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Favourite not found");
    }
    const car = favourite.referenceId;
    return {
        favouriteId: favourite._id,
        isFavourite: true,
        car: {
            _id: car._id,
            title: car.title,
            images: car.images,
            pricePerDay: car.pricePerDay,
            location: car.location,
            year: car.year,
            brand: car.brand,
            model: car.model,
            description: car.description,
            userId: car.userId
                ? {
                    _id: car.userId._id,
                    name: car.userId.name,
                    profileImage: car.userId.profileImage,
                }
                : null,
            category: car.category,
        },
    };
});
const deleteFavourite = (userId, referenceId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield favouriteCar_model_1.FavouriteCar.deleteOne({ userId, referenceId });
    if (!result.deletedCount) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Bookmark not found");
    }
    return { message: "Bookmark removed successfully" };
});
exports.FavouriteCarServices = {
    toggleFavourite,
    checkFavouriteCarStatus,
    getFavourite,
    getSingleFavourite,
    deleteFavourite,
};
