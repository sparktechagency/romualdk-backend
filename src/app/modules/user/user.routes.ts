import { FOLDER_NAMES } from "./../../../enums/files";
import express from "express";
import { USER_ROLES } from "../../../enums/user";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import fileUploadHandler from "../../middlewares/fileUploaderHandler";
import parseAllFilesData from "../../middlewares/parseAllFileData";

const router = express.Router();

const requireAdminOrSuperAdmin = auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN);
const requireSuperAdmin = auth(USER_ROLES.SUPER_ADMIN);
const requireHostOrUser = auth(USER_ROLES.HOST, USER_ROLES.USER);
const requireAnyUser = auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER, USER_ROLES.HOST);


/* ---------------------------- PROFILE ROUTES ---------------------------- */
router
  .route("/profile")
  .get(
    requireAnyUser,
    UserController.getUserProfile,
  )
  .delete(auth(USER_ROLES.USER, USER_ROLES.HOST), UserController.deleteProfile);

/* ---------------------------- ADMIN CREATE ------------------------------ */
router.post(
  "/create-admin",
  validateRequest(UserValidation.createAdminZodSchema),
  UserController.createAdmin,
);

/* ---------------------------- HOST LIST & DETAILS ----------------------- */
router.get(
  "/host",
  requireAdminOrSuperAdmin,
  UserController.getAllHosts,
);
router.get(
  "/host/:id",
  requireAdminOrSuperAdmin,
  UserController.getHostById,
);

/* ---------------------------- ADMINS LIST ------------------------------- */
router.get("/admins", requireSuperAdmin, UserController.getAdmin);
router.delete(
  "/admins/:id",
  requireSuperAdmin,
  UserController.deleteAdmin,
);

/* ---------------------------- HOST REQUESTS ----------------------------- */
router.get(
  "/host-request",
  requireAdminOrSuperAdmin,
  UserController.getAllHostRequests,
);

router.post(
  "/become-host",
  requireHostOrUser,
  fileUploadHandler(),
  parseAllFilesData(
    { fieldName: FOLDER_NAMES.NID_FRONT_PIC, forceSingle: true },
    { fieldName: FOLDER_NAMES.NID_BACK_PIC, forceSingle: true },
    { fieldName: FOLDER_NAMES.DRIVING_LICENSE_FRONT_PIC, forceSingle: true },
    { fieldName: FOLDER_NAMES.DRIVING_LICENSE_BACK_PIC, forceSingle: true },
  ),
  UserController.createHostRequest,
);

router
  .route("/host-request/status/:id")
  .patch(
    requireAdminOrSuperAdmin,
    UserController.changeHostRequestStatusById,
  );

router
  .route("/host-request/:id")
  .get(
    requireAdminOrSuperAdmin,
    UserController.getHostRequestById,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.deleteHostRequestById,
  );

/* ---------------------------- USER CREATE & UPDATE ---------------------- */
router
  .route("/")
  .post(UserController.createUser)
  .patch(
    requireAnyUser,
    fileUploadHandler(),
    parseAllFilesData({
      fieldName: FOLDER_NAMES.PROFILE_IMAGE,
      forceSingle: true,
    }),
    UserController.updateProfile,
  )
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    UserController.getAllUsers,
  );

/* ---------------------------- SWITCH PROFILE ---------------------------- */
router.patch(
  "/switch-profile",
  requireHostOrUser,
  UserController.switchProfile,
);

/* ---------------------------- STATUS UPDATE ----------------------------- */
router.patch(
  "/host/status/:id",
 requireAdminOrSuperAdmin,
  UserController.updateHostStatusById,
);
router.patch(
  "/status/:id",
  requireAdminOrSuperAdmin,
  UserController.updateUserStatusById,
);

/* ---------------------------- DYNAMIC USER ID ROUTES (KEEP LAST!) ------- */
router
  .route("/:id")
  .get(
    requireAdminOrSuperAdmin,
    UserController.getUserById,
  )
  .delete(
    requireAdminOrSuperAdmin,
    UserController.deleteUserById,
  );

export const UserRoutes = router;
