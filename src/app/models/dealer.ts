export interface DealerSaleRequest {
  dealerId: number;
  customerId?: number;
  saleAmount: number;
  description?: string;
}

export interface DealerSaleResponse {
  commissionLogId: number;
  dealerId: number;
  dealerName: string;
  customerId?: number;
  saleAmount: number;
  commissionAmount: number;
  description: string;
  saleDate: string;
}

export interface DealerCommissionSummary {
  dealerId: number;
  dealerName: string;
  period: string;
  totalCommission: number;
  currency: string;
}
