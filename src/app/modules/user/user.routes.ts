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

router.get(
    '/profile',
    auth(USER_ROLES.ADMIN, USER_ROLES.USER),
    UserController.getUserProfile
);

router.post(
    '/create-admin',
    validateRequest(UserValidation.createAdminZodSchema),
    UserController.createAdmin
);

router.post("/become-host",
    auth(USER_ROLES.USER, USER_ROLES.HOST),
    fileUploadHandler(),
    parseAllFilesData(
        { fieldName: FOLDER_NAMES.NID_FRONT_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.NID_BACK_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.DRIVING_LICENSE_FRONT_PIC, forceSingle: true },
        { fieldName: FOLDER_NAMES.DRIVING_LICENSE_BACK_PIC, forceSingle: true }
    ),
    UserController.createHostRequest);

router
    .route('/')
    .post(
        UserController.createUser
    )
    .patch(
        auth(USER_ROLES.ADMIN, USER_ROLES.USER),
        fileUploadHandler(),
        parseAllFilesData({ fieldName: FOLDER_NAMES.PROFILE_IMAGE, forceSingle: true }),
        UserController.updateProfile
    );

router.patch("/switch-profile", auth(USER_ROLES.USER, USER_ROLES.HOST), UserController.switchProfile)

router.route("/host-request")
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getAllHostRequests)

router.route("/host-request/:id")
    .get(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.getHostRequestById)
    .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.deleteHostRequestById)

router.route("/host-request/status/:id")
    .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), UserController.changeHostRequestStatusById)





export const UserRoutes = router;