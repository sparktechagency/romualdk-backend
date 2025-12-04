import { FOLDER_NAMES } from './../../../enums/files';
import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import parseAllFilesData from '../../middlewares/parseAllFileData';

const router = express.Router();

/* ---------------------------- PROFILE ROUTES ---------------------------- */
router.route("/profile")
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN, USER_ROLES.HOST), UserController.getUserProfile)
    .delete(auth(USER_ROLES.USER, USER_ROLES.HOST), UserController.deleteProfile);

/* ---------------------------- ADMIN CREATE ------------------------------ */
router.post(
    '/create-admin',
    validateRequest(UserValidation.createAdminZodSchema),
    UserController.createAdmin
);

/* ---------------------------- HOST LIST & DETAILS ----------------------- */
router.get("/host", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getAllHosts);
router.get("/host/:id", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getHostById);

/* ---------------------------- ADMINS LIST ------------------------------- */
router.get("/admins", auth(USER_ROLES.SUPER_ADMIN), UserController.getAdmin);
router.delete("/admins/:id", auth(USER_ROLES.SUPER_ADMIN), UserController.deleteAdmin);

/* ---------------------------- HOST REQUESTS ----------------------------- */
router.get("/host-request", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getAllHostRequests);

router.post(
    "/become-host",
    auth(USER_ROLES.USER, USER_ROLES.HOST),
    fileUploadHandler(),
    parseAllFilesData(
        { fieldName: FOLDER_NAMES.NID_FRONT_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.NID_BACK_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.DRIVING_LICENSE_FRONT_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.DRIVING_LICENSE_BACK_PIC, forceSingle: true }
    ),
    UserController.createHostRequest
);

router.route("/host-request/status/:id")
    .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.changeHostRequestStatusById);

router.route("/host-request/:id")
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getHostRequestById)
    .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.deleteHostRequestById);

/* ---------------------------- USER CREATE & UPDATE ---------------------- */
router.route("/")
    .post(UserController.createUser)
    .patch(
        auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN),
        fileUploadHandler(),
        parseAllFilesData({ fieldName: FOLDER_NAMES.PROFILE_IMAGE, forceSingle: true }),
        UserController.updateProfile
    )
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getAllUsers);

/* ---------------------------- SWITCH PROFILE ---------------------------- */
router.patch("/switch-profile", auth(USER_ROLES.USER, USER_ROLES.HOST), UserController.switchProfile);

/* ---------------------------- STATUS UPDATE ----------------------------- */
router.patch("/host/status/:id", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.updateHostStatusById);
router.patch("/status/:id", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.updateUserStatusById);

/* ---------------------------- DYNAMIC USER ID ROUTES (KEEP LAST!) ------- */
router.route("/:id")
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getUserById)
    .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.deleteUserById);

export const UserRoutes = router;
