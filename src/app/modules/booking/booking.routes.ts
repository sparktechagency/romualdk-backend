import { Router } from "express";
import { BookingController } from "./booking.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";
import { createBookingSchema } from "./booking.validation";

const router = Router();

router.post("/", auth(USER_ROLES.ADMIN, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), validateRequest(createBookingSchema as any), BookingController.createBooking) ;

router.get("/my", auth(), BookingController.myBookings);
router.get("/host", auth(), BookingController.hostBookings);
router.patch("/check-in/:id", auth(USER_ROLES.ADMIN, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), BookingController.checkInController );
router.patch("/check-out/:id", auth(USER_ROLES.ADMIN, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN,  USER_ROLES.USER), BookingController.checkOutController );
router.patch("/is-cancelled/:id", auth(USER_ROLES.ADMIN, USER_ROLES.HOST, USER_ROLES.SUPER_ADMIN, USER_ROLES.USER), BookingController.isCancelledController );

export const bookingRoutes = router;
