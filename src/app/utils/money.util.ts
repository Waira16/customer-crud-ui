export function roundMoney(value: number | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100) / 100;
}

export function formatMoney(value: number | null | undefined): string {
  return roundMoney(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ₺';
}

export function formatMoneyAmount(value: number | null | undefined): string {
  return roundMoney(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
