// ...existing code...
import Stripe from "stripe";
import stripe from "../../../config/stripe";
import config from "../../../config";
import { Booking } from "../booking/booking.model";
import { Transaction, TransactionStatus, PaymentMethod, PayoutStatus } from "./transaction.model";
import { BOOKING_STATUS, CAR_STATUS } from "../booking/booking.interface";
import { InitiatePaymentDto } from "./payment.interface";
import { User } from "../user/user.model";

const COMMISSION_RATE = 0.15; // 15% commission

const createCheckoutSession = async (input: InitiatePaymentDto) => {
  const { bookingId, customerEmail, customerName, customerPhone } = input;

  const booking = await Booking.findById(bookingId).populate("carId");
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== BOOKING_STATUS.PENDING)
    throw new Error("Booking already paid or canceled");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: [PaymentMethod.CARD],
    mode: "payment",
    success_url: `${process.env.BASE_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/api/payments/cancel`,
    customer_email: customerEmail,
    client_reference_id: bookingId,
    metadata: { booking_id: bookingId },
    line_items: [
      {
        price_data: {
          currency: "xof",
          product_data: {
          name: `${(booking.carId as any).brand} ${(booking.carId as any).model} (${(booking.carId as any).licensePlate})`,
          description: `Booking ID is #${bookingId} for ${(booking.carId as any).brand}, ${(booking.carId as any).model}, ${(booking.carId as any).year}, ${(booking.carId as any).color}`,
          },
          unit_amount: Math.round(booking.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    phone_number_collection: { enabled: true },
    billing_address_collection: "required",
  });

  // await Transaction.create({
  //   bookingId: booking._id,
  //   amount: booking.totalAmount,
  //   method: PaymentMethod.CARD,
  //   stripeSessionId: session.id,
  //   status: TransactionStatus.PENDING,
  // });
  await Transaction.create({
  bookingId: booking._id,
  amount: booking.totalAmount,
  method: PaymentMethod.CARD,
  stripeSessionId: session.id,
  status: TransactionStatus.PENDING,
}).then(async (trx) => {
  await Booking.findByIdAndUpdate(booking._id, {
    transactionId: trx._id
  });
});

  return {
    success: true,
    paymentUrl: session.url!,
    sessionId: session.id,
  };
};

const handleWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = (stripe as unknown as Stripe).webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret as string,
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return false;
  }

   // ================= PAYMENT SUCCESS =================

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId =
      session.client_reference_id || session.metadata?.booking_id;

    if (!bookingId) return false;

    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === BOOKING_STATUS.PENDING) {
      booking.status = BOOKING_STATUS.PAID;

       // --------- CAR STATUS LOGIC (Rules) --------- //
    if (!booking.checkIn && !booking.checkOut) {
        booking.carStatus
         = CAR_STATUS.UPCOMING;  
      }

      await booking.save();

      await Transaction.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: TransactionStatus.SUCCEEDED,
          stripePaymentIntentId: session.payment_intent as string,
        },
      );

      return true;
    }
  }
 
  // ================= STRIPE CONNECT ONBOARDING =================
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    await User.findOneAndUpdate(
      { connectedAccountId: account.id },
      {
        onboardingCompleted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
      },
    );

    return true;
  }

  return false;
};

// ================= PAYOUT TO HOST =================
const payoutToHost = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || booking.payoutProcessed || !booking.checkOut) return;

  const host = await User.findById(booking.hostId);
  console.log("Host info:", host);
  if (!host?.connectedAccountId || !host.payoutsEnabled) {
    throw new Error("Host payout not enabled");
  }

  const transaction = await Transaction.findById(booking.transactionId);
  if (!transaction || transaction.status !== TransactionStatus.SUCCEEDED) {
    throw new Error("Payment not completed");
  }

  const commission = Math.round(transaction.amount * COMMISSION_RATE);
  const payoutAmount = transaction.amount - commission;

  const transfer = await stripe.transfers.create({
    amount: payoutAmount * 100,
    currency: transaction.currency,
    destination: host.connectedAccountId,
    source_transaction: transaction.stripePaymentIntentId!,
    
  });

  await Transaction.findByIdAndUpdate(transaction._id, {
    commissionAmount: commission,
    payoutStatus: PayoutStatus.SUCCEEDED,
    stripeTransferId: transfer.id,
    hostReceiptAmount: payoutAmount,
  });

  await Booking.findByIdAndUpdate(bookingId, {
    payoutProcessed: true,
    payoutAt: new Date(),
  });
};

 

// -------- Export as object ----------

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
  payoutToHost,
};
 
