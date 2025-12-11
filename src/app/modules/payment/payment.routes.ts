// src/app/modules/payment/payment.routes.ts

import { Router } from "express";
import express from "express";
import {
  initiatePayment,
  stripeWebhook,
  success,
  cancel,
} from "./payment.controller";

const router = Router();

router.post("/create", initiatePayment);
router.get("/success", success);
router.get("/cancel", cancel);

export const paymentRoutes = router;