 
import { Router } from "express";
import { BookingController } from "./booking.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

const router = Router();

router.post("/", auth(USER_ROLES.ADMIN, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), BookingController.create) ;
router.get("/my", auth(), BookingController.myBookings);
router.get("/host", auth(), BookingController.hostBookings);

export const bookingRoutes = router;
