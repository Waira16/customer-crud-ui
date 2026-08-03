export interface Invoice {

  id: number;

  customerId?: number;

  customerName: string;

  amount: number;

  dueDate: string;

  status: 'PAID' | 'UNPAID' | string;

  billingPeriod: string;

  paymentDate?: string;

  penaltyFee?: number;

  paymentType?: 'PREPAID' | 'POSTPAID' | string;

  tariffTotal?: number;

  addonTotal?: number;

  installmentTotal?: number;

  deviceInstallments?: string[];

  tariffs?: string[];

  addons?: string[];

  riskStatus?: 'LOW' | 'MEDIUM' | 'HIGH' | string;

}
