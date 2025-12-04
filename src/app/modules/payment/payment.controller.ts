import { Request, Response } from "express";
import { PaymentService } from "./payment.service";
// import { initiatePaymentSchema } from './validations/payment.validation';

export class PaymentController {
  static async initiate(req: Request, res: Response) {
    try {
      //   const input = initiatePaymentSchema.parse(req.body);
      const input = req.body;
      const result = await PaymentService.initiate(input);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.errors?.[0]?.message || error.message,
      });
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const signature = req.headers["x-cinetpay-signature"] as string;
      const success = await PaymentService.handleWebhook(req.body, signature);

      res.json({ success });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook processing failed" });
    }
  }

  static callback(req: Request, res: Response) {
    const status = req.query.status;
    if (status === "success") {
      res.redirect("myapp://payment-success");
    } else {
      res.redirect("myapp://payment-failed");
    }
  }
}
