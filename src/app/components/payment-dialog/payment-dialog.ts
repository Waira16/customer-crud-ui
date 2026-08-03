import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import { PaymentRequest } from '../../models/payment-request';
import {
  DEMO_PAYMENT_CARD,
  formatCardNumber,
  formatExpiryDate,
  isValidCvv,
  isValidExpiryDate,
  isValidLuhn,
  stripCardDigits
} from '../../utils/luhn.util';
import { formatMoney as formatMoneyUtil } from '../../utils/money.util';
import {
  calculateInstallmentTotal,
  calculateInterestAmount,
  calculateMonthlyInstallment,
  getInstallmentRateLabel,
  INSTALLMENT_MONTH_OPTIONS,
  isInterestFreeInstallment
} from '../../utils/installment.util';

export interface PaymentDialogData {
  title: string;
  subtitle?: string;
  amount?: number;
  showInstallmentOptions?: boolean;
  devicePrice?: number;
}

export interface PaymentDialogResult extends PaymentRequest {
  installments?: number;
}

export function getDemoPaymentRequest(): PaymentRequest {
  return {
    cardNumber: stripCardDigits(DEMO_PAYMENT_CARD.number),
    expiryDate: DEMO_PAYMENT_CARD.expiry,
    cvv: DEMO_PAYMENT_CARD.cvv
  };
}

interface InstallmentOption {
  months: number;
  label: string;
  interestFree: boolean;
  rateLabel: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule
  ],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.css'
})
export class PaymentDialogComponent {

  cardNumber = '';
  expiryDate = '';
  cvv = '';
  selectedInstallments = 6;

  cardTouched = false;
  expiryTouched = false;
  cvvTouched = false;

  readonly installmentOptions: InstallmentOption[] = INSTALLMENT_MONTH_OPTIONS.map((months) => ({
    months,
    label: `${months} Ay`,
    interestFree: isInterestFreeInstallment(months),
    rateLabel: getInstallmentRateLabel(months)
  }));

  constructor(
    private dialogRef: MatDialogRef<PaymentDialogComponent, PaymentDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) {}

  onCardNumberInput(value: string): void {
    this.cardNumber = formatCardNumber(value);
    this.cardTouched = true;
  }

  onExpiryInput(value: string): void {
    this.expiryDate = formatExpiryDate(value);
    this.expiryTouched = true;
  }

  onCvvInput(value: string): void {
    this.cvv = (value || '').replace(/\D/g, '').slice(0, 4);
    this.cvvTouched = true;
  }

  get cardDigits(): string {
    return stripCardDigits(this.cardNumber);
  }

  get showCardError(): boolean {
    if (!this.cardTouched) {
      return false;
    }

    return this.cardDigits.length >= 13 && !isValidLuhn(this.cardNumber);
  }

  get showExpiryError(): boolean {
    return this.expiryTouched
      && this.expiryDate.length === 5
      && !isValidExpiryDate(this.expiryDate);
  }

  get showCvvError(): boolean {
    return this.cvvTouched
      && this.cvv.length >= 3
      && !isValidCvv(this.cvv);
  }

  get isFormValid(): boolean {
    return isValidLuhn(this.cardNumber)
      && isValidExpiryDate(this.expiryDate)
      && isValidCvv(this.cvv);
  }

  get installmentBasePrice(): number {
    return this.data.devicePrice ?? this.data.amount ?? 0;
  }

  formatMoney(value?: number): string {
    if (value == null) {
      return '';
    }

    return formatMoneyUtil(value);
  }

  getMonthlyInstallment(months: number): number {
    return calculateMonthlyInstallment(this.installmentBasePrice, months);
  }

  getInstallmentTotal(months: number): number {
    return calculateInstallmentTotal(this.installmentBasePrice, months);
  }

  getInterestAmount(months: number): number {
    return calculateInterestAmount(this.installmentBasePrice, months);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  payDirect(): void {
    this.dialogRef.close(this.buildResult(getDemoPaymentRequest()));
  }

  pay(): void {
    this.cardTouched = true;
    this.expiryTouched = true;
    this.cvvTouched = true;

    if (!this.isFormValid) {
      return;
    }

    this.dialogRef.close(this.buildResult({
      cardNumber: this.cardDigits,
      expiryDate: this.expiryDate,
      cvv: this.cvv
    }));
  }

  private buildResult(payment: PaymentRequest): PaymentDialogResult {
    if (!this.data.showInstallmentOptions) {
      return payment;
    }

    return {
      ...payment,
      installments: this.selectedInstallments
    };
  }
}
