"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const car_controller_1 = require("./car.controller");
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const parseAllFileData_1 = __importDefault(require("../../middlewares/parseAllFileData"));
const router = express_1.default.Router();
router.route("/")
    .post((0, auth_1.default)(user_1.USER_ROLES.HOST), (0, fileUploaderHandler_1.default)(), (0, parseAllFileData_1.default)({ fieldName: "carRegistrationPaperFrontPic", forceSingle: true }, { fieldName: "carRegistrationPaperBackPic", forceSingle: true }, { fieldName: "images", forceMultiple: true }), car_controller_1.CarControllers.createCar)
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), car_controller_1.CarControllers.getAllCars);
router.get("/my", (0, auth_1.default)(user_1.USER_ROLES.HOST), car_controller_1.CarControllers.getOwnCars);
router.get("/availability/:carId", car_controller_1.CarControllers.getAvailability);
router.patch("/blocked/:carId", (0, auth_1.default)(user_1.USER_ROLES.HOST), car_controller_1.CarControllers.createCarBlockedDates);
router.route("/:id")
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST, user_1.USER_ROLES.SUPER_ADMIN, user_1.USER_ROLES.USER), car_controller_1.CarControllers.getCarById)
    .patch((0, auth_1.default)(user_1.USER_ROLES.HOST), (0, fileUploaderHandler_1.default)(), (0, parseAllFileData_1.default)({ fieldName: "carRegistrationPaperFrontPic", forceSingle: true }, { fieldName: "carRegistrationPaperBackPic", forceSingle: true }, { fieldName: "images", forceMultiple: true }), car_controller_1.CarControllers.updateCarById)
    .delete((0, auth_1.default)(user_1.USER_ROLES.HOST), car_controller_1.CarControllers.deleteCarById);
exports.CarRoutes = router;
