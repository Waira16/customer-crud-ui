export interface PaymentRequest {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface BalanceTopUpRequest extends PaymentRequest {
  amount: number;
}
