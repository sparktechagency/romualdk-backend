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
exports.ReviewServices = void 0;
const mongoose_1 = require("mongoose");
const review_model_1 = require("./review.model");
const review_interface_1 = require("./review.interface");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const car_model_1 = require("../car/car.model");
const createReviewToDB = (payload, reviewerId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { carId } = payload;
    if (!carId) {
        throw new ApiErrors_1.default(400, "carId is required");
    }
    const car = yield car_model_1.Car.findById(carId); // hostId = User _id
    if (!car)
        throw new ApiErrors_1.default(404, "Car not found");
    const hostUserId = car.userId.toString();
    if (hostUserId === reviewerId) {
        throw new ApiErrors_1.default(400, "You cannot review your own car");
    }
    if (!Number.isInteger(payload.ratingValue) || payload.ratingValue < 1 || payload.ratingValue > 5) {
        throw new ApiErrors_1.default(400, "Rating must be an integer between 1 and 5");
    }
    const reviewData = {
        carId: new mongoose_1.Types.ObjectId(carId),
        hostId: car.userId, // User _id
        fromUserId: new mongoose_1.Types.ObjectId(reviewerId),
        ratingValue: payload.ratingValue,
        feedback: (_a = payload.feedback) === null || _a === void 0 ? void 0 : _a.trim(),
    };
    // check if already reviewed
    const already = yield review_model_1.Review.findOne({
        carId: reviewData.carId,
        fromUserId: reviewData.fromUserId,
    });
    if (already)
        throw new ApiErrors_1.default(400, "You have already reviewed this car");
    const review = yield review_model_1.Review.create(reviewData);
    return review;
});
const getReviewSummaryFromDB = (targetId, type) => __awaiter(void 0, void 0, void 0, function* () {
    const objectId = new mongoose_1.Types.ObjectId(targetId);
    if (!targetId || !type) {
        throw new ApiErrors_1.default(400, "targetId and type (CAR/HOST) are required");
    }
    if (type !== review_interface_1.REVIEW_TYPE.CAR && type !== review_interface_1.REVIEW_TYPE.HOST) {
        throw new ApiErrors_1.default(400, "Invalid type. Use 'CAR' or 'HOST'");
    }
    const isCar = type === review_interface_1.REVIEW_TYPE.CAR;
    const matchQuery = isCar ? { carId: objectId } : { hostId: objectId };
    const summary = yield review_model_1.Review.aggregate([
        { $match: matchQuery },
        { $match: { ratingValue: { $in: [1, 2, 3, 4, 5] } } },
        { $group: { _id: "$ratingValue", count: { $sum: 1 } } },
    ]);
    const totalReviews = summary.reduce((a, c) => a + c.count, 0);
    const totalScore = summary.reduce((a, c) => a + c._id * c.count, 0);
    const average = totalReviews ? totalScore / totalReviews : 0;
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    summary.forEach((item) => {
        const rating = item._id;
        if (rating >= 1 && rating <= 5) {
            starCounts[rating] = item.count;
        }
    });
    // reviews list 
    const reviews = yield review_model_1.Review.find(matchQuery)
        .populate({
        path: "fromUserId",
        select: "name profileImage _id",
    })
        .sort({ createdAt: -1 })
        .lean();
    const reviewList = reviews.map((review) => ({
        reviewId: review._id,
        ratingValue: review.ratingValue,
        feedback: review.feedback,
        fromUser: {
            _id: review.fromUserId._id,
            name: review.fromUserId.name,
            profileImage: review.fromUserId.profileImage,
        },
    }));
    return {
        averageRating: Number(average.toFixed(1)),
        totalReviews,
        starCounts,
        reviews: reviewList,
    };
});
exports.ReviewServices = {
    createReviewToDB,
    getReviewSummaryFromDB,
};
