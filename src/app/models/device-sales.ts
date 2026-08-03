export type SalesDeviceCategory = 'PHONE' | 'TABLET' | 'MODEM';

export interface SalesDevice {
  id: number;
  brand: string;
  model: string;
  category: SalesDeviceCategory;
  price: number;
  stockQuantity: number;
  monthlyInstallmentEstimate?: number;
}

export interface DevicePurchaseRequest {
  customerId: number;
  deviceId: number;
  installments?: number;
}

export interface DevicePurchaseResponse {
  contractId: number;
  customerId: number;
  deviceName: string;
  monthlyInstallment: number;
  totalInstallments: number;
  remainingInstallments: number;
  startDate: string;
  message: string;
}
