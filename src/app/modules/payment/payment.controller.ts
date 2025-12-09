import { Request, Response } from "express";
import { createCheckoutSession, handleWebhook } from "./payment.service";
import { initiatePaymentSchema } from "./payment.validation";

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const input = initiatePaymentSchema.parse(req.body);
    // const input = req.body;
    const result = await createCheckoutSession(input);
    res.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e: any) => e.message),
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) return res.status(400).send("Missing stripe-signature");

  const success = await handleWebhook(req.body, sig);
  res.json({ received: true, success });
};

export const success = (_req: Request, res: Response) => {
  res.redirect("myapp://payment-success");
};

export const cancel = (_req: Request, res: Response) => {
  res.redirect("myapp://payment-failed");
};