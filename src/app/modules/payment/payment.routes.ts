// src/app/modules/payment/payment.routes.ts

import { Router } from "express";
import { initiatePaymentSchema } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";

const router = Router();

router.post("/create", validateRequest(initiatePaymentSchema), PaymentController.initiatePayment);
router.get("/success",  PaymentController.success);
router.get("/cancel",   PaymentController.cancel);

export const paymentRoutes = router;
