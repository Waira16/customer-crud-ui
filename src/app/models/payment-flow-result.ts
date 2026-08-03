import { PaymentRequest } from './payment-request';

export interface PaymentFlowResult {
  payment: PaymentRequest;
  installments?: number;
}
