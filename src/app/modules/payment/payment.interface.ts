export interface InitiatePaymentDto {
  bookingId: string;
  paymentMethod: 'creditCard' | 'eWallet' | 'flooz' | 'missByYaas';
  customerEmail: string;
  customerPhone: string;
  customerName: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentLink: string;
  transactionRef: string;
  message?: string;
}