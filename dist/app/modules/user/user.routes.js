"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const files_1 = require("./../../../enums/files");
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const parseAllFileData_1 = __importDefault(require("../../middlewares/parseAllFileData"));
const router = express_1.default.Router();
/* ---------------------------- PROFILE ROUTES ---------------------------- */
router.route("/profile")
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER), user_controller_1.UserController.getUserProfile)
    .delete((0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), user_controller_1.UserController.deleteProfile);
/* ---------------------------- ADMIN CREATE ------------------------------ */
router.post('/create-admin', (0, validateRequest_1.default)(user_validation_1.UserValidation.createAdminZodSchema), user_controller_1.UserController.createAdmin);
/* ---------------------------- HOST LIST & DETAILS ----------------------- */
router.get("/host", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllHosts);
router.get("/host/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getHostById);
/* ---------------------------- ADMINS LIST ------------------------------- */
router.get("/admins", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAdmin);
router.delete("/admins/:id", (0, auth_1.default)(user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteAdmin);
/* ---------------------------- HOST REQUESTS ----------------------------- */
router.get("/host-request", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllHostRequests);
router.post("/become-host", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), (0, fileUploaderHandler_1.default)(), (0, parseAllFileData_1.default)({ fieldName: files_1.FOLDER_NAMES.NID_FRONT_PIC, forceSingle: true }, { fieldName: files_1.FOLDER_NAMES.NID_BACK_PIC, forceSingle: true }, { fieldName: files_1.FOLDER_NAMES.DRIVING_LICENSE_FRONT_PIC, forceSingle: true }, { fieldName: files_1.FOLDER_NAMES.DRIVING_LICENSE_BACK_PIC, forceSingle: true }), user_controller_1.UserController.createHostRequest);
router.route("/host-request/status/:id")
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.changeHostRequestStatusById);
router.route("/host-request/:id")
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getHostRequestById)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteHostRequestById);
/* ---------------------------- USER CREATE & UPDATE ---------------------- */
router.route("/")
    .post(user_controller_1.UserController.createUser)
    .patch((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.SUPER_ADMIN), (0, fileUploaderHandler_1.default)(), (0, parseAllFileData_1.default)({ fieldName: files_1.FOLDER_NAMES.PROFILE_IMAGE, forceSingle: true }), user_controller_1.UserController.updateProfile)
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getAllUsers);
/* ---------------------------- SWITCH PROFILE ---------------------------- */
router.patch("/switch-profile", (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), user_controller_1.UserController.switchProfile);
/* ---------------------------- STATUS UPDATE ----------------------------- */
router.patch("/host/status/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.updateHostStatusById);
router.patch("/status/:id", (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.updateUserStatusById);
/* ---------------------------- DYNAMIC USER ID ROUTES (KEEP LAST!) ------- */
router.route("/:id")
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.getUserById)
    .delete((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), user_controller_1.UserController.deleteUserById);
exports.UserRoutes = router;
