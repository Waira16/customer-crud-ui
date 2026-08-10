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

import {
  DEMO_PAYMENT_CARD,
  formatCardNumber,
  formatExpiryDate,
  isValidCvv,
  isValidExpiryDate,
  isValidLuhn,
  stripCardDigits
} from '../luhn.util';
import {
  calculateInstallmentTotal,
  calculateInterestAmount,
  calculateMonthlyInstallment,
  DEFAULT_INSTALLMENT_MONTHS,
  getInstallmentRateLabel,
  INSTALLMENT_MONTH_OPTIONS,
  isInterestFreeInstallment
} from 'telecom-shared';

export type PaymentMethod = 'CARD' | 'INVOICE';

export interface PaymentDialogData {
  title: string;
  subtitle?: string;
  amount?: number;
  showInstallmentOptions?: boolean;
  devicePrice?: number;
  allowBillToInvoice?: boolean;
}

export interface PaymentDialogResult {
  method: PaymentMethod;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  /** 0 = peşin, 2/3/6/12/18 = taksit */
  installments?: number;
}

interface InstallmentOption {
  months: number;
  label: string;
  interestFree: boolean;
  rateLabel: string;
}

@Component({
  selector: 'self-payment-dialog',
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
  paymentMethod: PaymentMethod = 'CARD';
  cardNumber: string = DEMO_PAYMENT_CARD.number;
  expiryDate: string = DEMO_PAYMENT_CARD.expiry;
  cvv: string = DEMO_PAYMENT_CARD.cvv;
  selectedInstallments = 0;

  cardTouched = false;
  expiryTouched = false;
  cvvTouched = false;

  readonly installmentOptions: InstallmentOption[] = [
    {
      months: 0,
      label: 'Peşin',
      interestFree: true,
      rateLabel: 'Tek çekim'
    },
    ...INSTALLMENT_MONTH_OPTIONS.map((months) => ({
      months,
      label: `${months} Ay`,
      interestFree: isInterestFreeInstallment(months),
      rateLabel: getInstallmentRateLabel(months)
    }))
  ];

  constructor(
    private dialogRef: MatDialogRef<PaymentDialogComponent, PaymentDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) {
    if (data.showInstallmentOptions) {
      this.selectedInstallments = DEFAULT_INSTALLMENT_MONTHS;
    }
  }

  get allowBillToInvoice(): boolean {
    return this.data.allowBillToInvoice !== false;
  }

  setMethod(method: PaymentMethod): void {
    this.paymentMethod = method;
  }

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

  get showCardError(): boolean {
    return this.cardTouched && !isValidLuhn(this.cardNumber);
  }

  get showExpiryError(): boolean {
    return this.expiryTouched && !isValidExpiryDate(this.expiryDate);
  }

  get showCvvError(): boolean {
    return this.cvvTouched && !isValidCvv(this.cvv);
  }

  get isFormValid(): boolean {
    if (this.paymentMethod === 'INVOICE') {
      return true;
    }
    return isValidLuhn(this.cardNumber)
      && isValidExpiryDate(this.expiryDate)
      && isValidCvv(this.cvv);
  }

  get installmentBasePrice(): number {
    return this.data.devicePrice ?? this.data.amount ?? 0;
  }

  get payableAmount(): number {
    if (!this.data.showInstallmentOptions || this.selectedInstallments <= 0) {
      return this.data.amount ?? this.installmentBasePrice;
    }
    const addonPart = Math.max(0, (this.data.amount ?? 0) - this.installmentBasePrice);
    return addonPart + this.getInstallmentTotal(this.selectedInstallments);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  }

  getMonthlyInstallment(months: number): number {
    if (months <= 0) {
      return this.installmentBasePrice;
    }
    return calculateMonthlyInstallment(this.installmentBasePrice, months);
  }

  getInstallmentTotal(months: number): number {
    if (months <= 0) {
      return this.installmentBasePrice;
    }
    return calculateInstallmentTotal(this.installmentBasePrice, months);
  }

  getInterestAmount(months: number): number {
    if (months <= 0) {
      return 0;
    }
    return calculateInterestAmount(this.installmentBasePrice, months);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  pay(): void {
    if (this.paymentMethod === 'CARD') {
      this.cardTouched = true;
      this.expiryTouched = true;
      this.cvvTouched = true;
      if (!this.isFormValid) {
        return;
      }
    }

    this.dialogRef.close({
      method: this.paymentMethod,
      cardNumber: this.paymentMethod === 'CARD' ? stripCardDigits(this.cardNumber) : undefined,
      expiryDate: this.paymentMethod === 'CARD' ? this.expiryDate : undefined,
      cvv: this.paymentMethod === 'CARD' ? this.cvv : undefined,
      installments: this.data.showInstallmentOptions ? this.selectedInstallments : 0
    });
  }

  get confirmLabel(): string {
    if (this.paymentMethod === 'INVOICE') {
      return this.selectedInstallments > 0 ? 'Öde · Faturaya Taksit' : 'Öde · Faturaya Yansıt';
    }
    return this.selectedInstallments > 0 ? 'Öde · Kartla Taksit' : 'Öde · Kart ile Al';
  }
}
