// import { z } from 'zod';

// export const initiatePaymentSchema = z.object({
//   bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid booking ID"),
//   paymentMethod: z.enum(['creditCard', 'eWallet', 'flooz', 'missByYaas']),
//   customerEmail: z.string().email(),
//   customerPhone: z.string().min(8),
//   customerName: z.string().min(2)
// });

// export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;