<<<<<<< HEAD
import express from "express";
import { USER_ROLES } from "../../../enums/user";
import { FaqController } from "./faq.controller";
import auth from "../../middlewares/auth";
=======
import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { FaqController } from './faq.controller';
import auth from '../../middlewares/auth';
>>>>>>> clean-payment

const router = express.Router();

router
<<<<<<< HEAD
  .route("/")
  .post(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), FaqController.createFaq)
  .get(FaqController.getFaqs);

router
  .route("/:id")
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqController.updateFaq,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    FaqController.deleteFaq,
  );
=======
    .route('/')
    .post(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), FaqController.createFaq)
    .get(FaqController.getFaqs);

router.route('/:id')
    .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), FaqController.updateFaq)
    .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), FaqController.deleteFaq);
>>>>>>> clean-payment

export const FaqRoutes = router;
