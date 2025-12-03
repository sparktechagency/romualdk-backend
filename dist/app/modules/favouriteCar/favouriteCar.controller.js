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
exports.FavouriteCarControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const favouriteCar_service_1 = require("./favouriteCar.service");
const toggleFavourite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { referenceId } = req.body;
    const result = yield favouriteCar_service_1.FavouriteCarServices.toggleFavourite({
        userId: id,
        referenceId,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: result.message || "Favourite toggled successfully",
        data: result,
    });
}));
const getFavourite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const result = yield favouriteCar_service_1.FavouriteCarServices.getFavourite(id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Favourites are Retrieved Successfully",
        data: result,
    });
}));
const getSingleFavourite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bookmarkId } = req.params;
    const { id: userId } = req.user;
    const result = yield favouriteCar_service_1.FavouriteCarServices.getSingleFavourite(userId, bookmarkId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Favourite is retrieved successfully by ID",
        data: result,
    });
}));
const deleteFavourite = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { referenceId } = req.params;
    const result = yield favouriteCar_service_1.FavouriteCarServices.deleteFavourite(id, referenceId);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Favourite is deleted successfully",
        data: result,
    });
}));
exports.FavouriteCarControllers = {
    toggleFavourite,
    getFavourite,
    deleteFavourite,
    getSingleFavourite,
};
