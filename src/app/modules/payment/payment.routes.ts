import * as express from 'express';
import { Router } from 'express';
import { verifyCinetPayWebhook } from '../../middlewares/verifyWebhook';
import { PaymentController } from './payment.controller';

const router = Router();

// Must be raw body for webhook
router.post('/webhook/cinetpay', 
  verifyCinetPayWebhook,
  express.raw({ type: 'application/json' }),
  PaymentController.webhook
);

router.post('/initiate', PaymentController.initiate);
router.get('/callback', PaymentController.callback);

export const paymentRoutes = router;