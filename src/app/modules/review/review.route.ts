import express from "express";
import { ReviewControllers } from "./review.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = express.Router();

router.route("/")
    .post(auth(USER_ROLES.USER, USER_ROLES.HOST,USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN), ReviewControllers.createReview)
    .get(ReviewControllers.getReviewSummary)

export const ReviewRoutes = router;