export interface InvoiceGenerateResult {

  billingPeriod: string;

  createdCount: number;

  skippedAlreadyBilledCount: number;

  skippedNoTariffCount: number;

  message: string;

}
