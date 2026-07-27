import { TariffChangePreview } from '../models/tariff-change-preview';
import { formatMoneyAmount } from './money.util';

export function isTariffDowngrade(preview: TariffChangePreview): boolean {
  return Number(preview.oldPrice) > Number(preview.newPrice);
}

export function requiresTariffChangeConfirmation(
  preview: TariffChangePreview
): boolean {
  return preview.commitmentWarning
    || Number(preview.penaltyAmount) > 0
    || isTariffDowngrade(preview);
}

export function buildTariffChangeConfirmMessage(
  preview: TariffChangePreview,
  tariffName?: string
): string {
  const parts: string[] = [];

  if (tariffName) {
    parts.push(`"${tariffName}" tarifesine geçilecek.`);
  }

  if (isTariffDowngrade(preview)) {
    parts.push('Yüksek tarifeden düşük tarifeye geçiyorsunuz.');
  }

  if (Number(preview.penaltyAmount) > 0) {
    parts.push(
      `Cayma bedeli: ${formatMoneyAmount(preview.penaltyAmount)} TL`
    );
    parts.push(`Kalan taahhüt: ${preview.remainingMonths} ay`);
  }

  if (Number(preview.proratedAmount) > 0) {
    parts.push(
      `Bu ay kıstelyevm tutarı: ${formatMoneyAmount(preview.proratedAmount)} TL`
    );
  }

  parts.push('Emin misiniz? Devam etmek istiyor musunuz?');

  return parts.join(' ');
}
