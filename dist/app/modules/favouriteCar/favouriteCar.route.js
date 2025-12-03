"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavouriteCarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const favouriteCar_controller_1 = require("./favouriteCar.controller");
const router = express_1.default.Router();
router.post("/toggle", (0, auth_1.default)(user_1.USER_ROLES.USER), favouriteCar_controller_1.FavouriteCarControllers.toggleFavourite);
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.USER), favouriteCar_controller_1.FavouriteCarControllers.getFavourite);
router.get("/:bookmarkId", (0, auth_1.default)(user_1.USER_ROLES.USER), favouriteCar_controller_1.FavouriteCarControllers.getSingleFavourite);
router.delete("/:referenceId", (0, auth_1.default)(user_1.USER_ROLES.USER), favouriteCar_controller_1.FavouriteCarControllers.deleteFavourite);
exports.FavouriteCarRoutes = router;
