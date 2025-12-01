import { Types } from "mongoose";
import { Review } from "./review.model";
import { REVIEW_TYPE, TReview } from "./review.interface";

import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";

const createReviewToDB = async (payload: TReview, reviewerId: string) => {
    const { carId } = payload;

    if (!carId) {
        throw new ApiError(400, "carId is required");
    }

    // 1. Car exist করে কিনা + তার host কে?
    const car = await Car.findById(carId).populate("hostId"); // hostId হল User _id
    if (!car) throw new ApiError(404, "Car not found");

    const hostUserId = car.hostId.toString();

    // 2. নিজের গাড়িতে রিভিউ দেওয়া যাবে না
    if (hostUserId === reviewerId) {
        throw new ApiError(400, "You cannot review your own car");
    }

    // 3. Payload setup
    const reviewData: TReview = {
        carId: new Types.ObjectId(carId),
        hostId: car.hostId, // User _id
        fromUserId: new Types.ObjectId(reviewerId),
        ratingValue: payload.ratingValue,
        feedback: payload.feedback?.trim(),
    };

    // 4. Already reviewed?
    const already = await Review.findOne({
        carId: reviewData.carId,
        fromUserId: reviewData.fromUserId,
    });
    if (already) throw new ApiError(400, "You have already reviewed this car");

    // 5. Create review
    const review = await Review.create(reviewData);

    // Optional: Car এ averageRating আপডেট করো (after create)
    await updateCarAverageRating(carId);
    // Host (User) এর average rating আপডেট করো
    await updateHostAverageRating(hostUserId);

    return review;
};

// Function to update the average rating of the Host (User)
const updateHostAverageRating = async (hostUserId: string) => {
    const result = await Review.aggregate([
        { $match: { hostId: new Types.ObjectId(hostUserId) } },
        {
            $group: {
                _id: null,
                totalRating: { $sum: "$ratingValue" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    const avg = result.length > 0
        ? result[0].totalRating / result[0].totalReviews
        : 0;

    await User.findByIdAndUpdate(hostUserId, {
        averageRating: Number(avg.toFixed(2)),
        totalReviews: result[0]?.totalReviews || 0,
    });
};

// Update the average rating of the Car (if the Car model includes an averageRating field)
const updateCarAverageRating = async (carId: string | Types.ObjectId) => {
    const result = await Review.aggregate([
        { $match: { carId: new Types.ObjectId(carId) } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: "$ratingValue" },
                total: { $sum: 1 },
            },
        },
    ]);

    const avg = result.length > 0 ? result[0].avgRating : 0;

    await Car.findByIdAndUpdate(carId, {
        averageRating: Number(avg.toFixed(2)),
        totalReviews: result[0]?.total || 0,
    });
};

const getReviewSummaryFromDB = async (targetId: string, type: REVIEW_TYPE.CAR | REVIEW_TYPE.HOST) => {

    const objectId = Types.ObjectId.createFromHexString(targetId);

    if (!targetId || !type) {
        throw new ApiError(400, "targetId and type (CAR/HOST) are required");
    }

    if (type !== REVIEW_TYPE.CAR && type !== REVIEW_TYPE.HOST) {
        throw new ApiError(400, "Invalid type. Use 'CAR' or 'HOST'");
    }

    const isCar = type === REVIEW_TYPE.CAR;
    const matchQuery = isCar ? { carId: objectId } : { hostId: objectId };

    // Summary
    const summary = await Review.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$ratingValue", count: { $sum: 1 } } },
    ]);

    const totalReviews = summary.reduce((a, c) => a + c.count, 0);
    const totalScore = summary.reduce((a, c) => a + c._id * c.count, 0);
    const average = totalReviews ? totalScore / totalReviews : 0;

    const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    summary.forEach((item) => {
        const rating = item._id as number;
        if (rating >= 1 && rating <= 5) {
            starCounts[rating] = item.count;
        }
    });

    // Reviews list
    const reviews = await Review.find(matchQuery)
        .populate({
            path: "fromUserId",
            select: "name profileImage _id",
        })
        .sort({ createdAt: -1 })
        .lean();

    const reviewList = reviews.map((review: any) => ({
        reviewId: review._id,
        ratingValue: review.ratingValue,
        feedback: review.feedback,
        fromUser: {
            _id: review.fromUserId._id,
            name: review.fromUserId.name,
            profileImage: review.fromUserId.profileImage,
        }
    }));

    return {
        averageRating: Number(average.toFixed(1)),
        totalReviews,
        starCounts,
        reviews: reviewList,
    };
};

export const ReviewServices = {
    createReviewToDB,
    getReviewSummaryFromDB,
};