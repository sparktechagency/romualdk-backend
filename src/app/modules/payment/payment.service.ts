import axios from 'axios';
import * as crypto from 'crypto';
import { InitiatePaymentDto } from './payment.interface';
import { Booking } from '../booking/booking.model';
import { Transaction } from './transaction.model';

const env = process.env as any;

export class PaymentService {
  static async initiate(dto: InitiatePaymentDto): Promise<PaymentResponse> {
    const booking = await Booking.findById(dto.bookingId);
    if (!booking || booking.status !== 'pending') {
      throw new Error('Booking not found or already paid');
    }

    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
      apikey: env.CINATPAY_API_KEY,
      site_id: env.CINATPAY_SITE_ID,
      transaction_id: transactionRef,
      amount: booking.totalAmount,
      currency: 'XOF',
      description: `Car Booking #${booking._id}`,
      channels: this.mapMethodToChannel(dto.paymentMethod),
      metadata: {
        booking_id: booking._id.toString(),
        user_id: booking.userId.toString()
      },
      customer_name: dto.customerName,
      customer_email: dto.customerEmail,
      customer_phone_number: dto.customerPhone,
      customer_address: "Lomé, Togo",
      notify_url: `${env.BASE_URL}/api/payments/webhook/cinetpay`,
      return_url: `${env.BASE_URL}/payment/callback`
    };

    try {
      const response = await axios.post('https://api-checkout.cinetpay.com/v2/payment', payload);
      
      if (response.data.code === '201') {
        await Transaction.create({
          bookingId: booking._id,
          amount: booking.totalAmount,
          method: dto.paymentMethod,
          externalRef: transactionRef
        });

        return {
          success: true,
          paymentLink: response.data.payment_url,
          transactionRef,
          message: 'Payment link generated'
        } as unknown as PaymentResponse;
      }
      throw new Error(response.data.message || 'Payment initiation failed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  private static mapMethodToChannel(method: string): string[] {
    const map: Record<string, string[]> = {
      creditCard: ['CARD'],
      eWallet: ['WALLET'],
      flooz: ['MOBILE_MONEY'],
      missByYaas: ['MOBILE_MONEY'] // CinetPay supports Yas.tg via mobile money
    };
    return map[method] || ['CARD', 'WALLET', 'MOBILE_MONEY'];
  }

  static async handleWebhook(body: any, signature: string): Promise<boolean> {
    const expected = crypto.createHmac('sha256', env.CINATPAY_SECRET_KEY).update(JSON.stringify(body)).digest('hex');
    
    if (expected !== signature) {
      console.log('Invalid webhook signature');
      return false;
    }

    if (body.cinetpay_response?.code === '00' && body.cinetpay_response?.status === 'ACCEPTED') {
      const bookingId = body.metadata?.booking_id;
      const booking = await Booking.findById(bookingId);
      
      if (booking && booking.status === 'pending') {
        booking.status = 'paid';
        await booking.save();

        await Transaction.updateOne(
          { externalRef: body.transaction_id },
          { status: 'paid' }
        );

        console.log(`Booking ${bookingId} paid successfully`);
        return true;
      }
    }
    return false;
  }
}