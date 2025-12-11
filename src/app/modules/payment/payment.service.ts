// ...existing code...
import Stripe from "stripe";
import stripe from "../../../config/stripe";
import config from "../../../config";
import { Booking } from "../booking/booking.model";
import { Transaction } from "./transaction.model";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { InitiatePaymentDto } from "./payment.interface";

export const createCheckoutSession = async (input: InitiatePaymentDto) => {
  const { bookingId, customerEmail, customerName, customerPhone } = input;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== BOOKING_STATUS.PENDING)
    throw new Error("Booking already paid or canceled");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
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
            name: "Car Rental Booking",
            description: `Booking #${bookingId}`,
          },
          unit_amount: Math.round(booking.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    phone_number_collection: { enabled: true },
    billing_address_collection: "required",
  });

  await Transaction.create({
    bookingId: booking._id,
    amount: booking.totalAmount,
    stripeSessionId: session.id,
    status: "pending",
  });

  return {
    success: true,
    paymentUrl: session.url!,
    sessionId: session.id,
  };
};

export const handleWebhook = async (rawBody: Buffer, sig: string) => {
  let event: Stripe.Event;

  try {
    event = (stripe as unknown as Stripe).webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret as string
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return false;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.client_reference_id || session.metadata?.booking_id;

    if (!bookingId) return false;

    const booking = await Booking.findById(bookingId);
    if (booking && booking.status === BOOKING_STATUS.PENDING) {
      booking.status = BOOKING_STATUS.PAID;
      await booking.save();

      await Transaction.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "succeeded",
          stripePaymentIntentId: session.payment_intent as string,
        }
      );

      console.log(`Payment Success! Booking ${bookingId} is now PAID`);
      return true;
    }
  }

  return false;
};
// ...existing code...