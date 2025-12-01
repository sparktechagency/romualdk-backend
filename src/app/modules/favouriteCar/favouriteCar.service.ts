import mongoose from "mongoose";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { FavouriteCar } from "./favouriteCar.model";

const checkFavouriteCarStatus = async (userId: string, referenceId: string) => {
    const favourite = await FavouriteCar.findOne({ userId, referenceId });
    return { isFavourite: !!favourite };
};

const toggleFavourite = async (payload: {
    userId: string;
    referenceId: string;
}) => {
    const { userId, referenceId } = payload;

    const existing = await FavouriteCar.findOne({ userId, referenceId });

    if (existing) {
        await FavouriteCar.deleteOne({ _id: existing._id });
        return { message: "Favourite removed successfully", isFavourite: false };
    }

    const newFavourite = await FavouriteCar.create({
        userId,
        referenceId: new mongoose.Types.ObjectId(referenceId),
    });

    return {
        message: "Favourite added successfully",
        isFavourite: true,
        data: newFavourite,
    };
};

const getFavourite = async (userId: string) => {
    const favourites = await FavouriteCar.find({ userId })
        .populate({
            path: "referenceId",
            populate: [
                { path: "user", select: "firstName lastName role email profileImage" },
                { path: "category", select: "name" },
            ],
        })
        .lean();

    const result = favourites.map((favourite: any) => {
        const car = favourite.referenceId;

        return {
            favouriteId: favourite._id,
            isFavourite: true, 
            car: {
                _id: car?._id,
                title: car?.title,
                images: car?.images,
                pricePerDay: car?.pricePerDay,
                location: car?.location,
                year: car?.year,
                brand: car?.brand,
                userId: car?.userId
                    ? {
                          _id: car.userId._id,
                          name: car.userId.name,
                          profileImage: car.userId.profileImage,
                      }
                    : null,
                category: car?.category,
            }
        };
    });


    return result;
};

const getSingleFavourite = async (userId: string, favouriteId: string) => {
    const favourite = await FavouriteCar.findOne({
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
        throw new ApiError(StatusCodes.NOT_FOUND, "Favourite not found");
    }

    const car = favourite.referenceId as any;

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
};

const deleteFavourite = async (userId: string, referenceId: string) => {
    const result = await FavouriteCar.deleteOne({ userId, referenceId });

    if (!result.deletedCount) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Bookmark not found");
    }

    return { message: "Bookmark removed successfully" };
};

export const FavouriteCarServices = {
    toggleFavourite,
    checkFavouriteCarStatus,
    getFavourite,
    getSingleFavourite,
    deleteFavourite,
};