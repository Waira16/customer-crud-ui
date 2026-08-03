export const INSTALLMENT_MONTH_OPTIONS = [2, 3, 6, 12, 18] as const;

export type InstallmentMonths = (typeof INSTALLMENT_MONTH_OPTIONS)[number];

const INTEREST_FREE_MONTHS = new Set<number>([2, 3, 6]);

const MONTHLY_INTEREST_RATES: Record<number, number> = {
  12: 0.0199,
  18: 0.0229
};

export function roundMoney(value: number | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

export function isInterestFreeInstallment(months: number): boolean {
  return INTEREST_FREE_MONTHS.has(months);
}

export function isAllowedInstallment(months: number): boolean {
  return INSTALLMENT_MONTH_OPTIONS.includes(months as InstallmentMonths);
}

export function getInstallmentRateLabel(months: number): string {
  if (isInterestFreeInstallment(months)) {
    return 'Faizsiz';
  }

  const rate = MONTHLY_INTEREST_RATES[months];
  if (rate == null) {
    return '';
  }

  return `%${(rate * 100).toFixed(2)} aylık faiz`;
}

export function calculateInstallmentTotal(basePrice: number, months: number): number {
  if (!basePrice || months <= 0) {
    return 0;
  }

  if (isInterestFreeInstallment(months)) {
    return roundMoney(basePrice);
  }

  const rate = MONTHLY_INTEREST_RATES[months] ?? 0;
  return roundMoney(basePrice * (1 + rate * months));
}

export function calculateMonthlyInstallment(basePrice: number, months: number): number {
  const total = calculateInstallmentTotal(basePrice, months);

  if (!total || months <= 0) {
    return 0;
  }

  return roundMoney(total / months);
}

export function calculateInterestAmount(basePrice: number, months: number): number {
  return roundMoney(calculateInstallmentTotal(basePrice, months) - basePrice);
}

export const DEFAULT_INSTALLMENT_MONTHS = 6;

export const DEFAULT_INSTALLMENT_ESTIMATE_MONTHS = 6;
