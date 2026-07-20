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

import { PaymentRequest } from '../../models/payment-request';
import {
  formatCardNumber,
  formatExpiryDate,
  isValidCvv,
  isValidExpiryDate,
  isValidLuhn,
  stripCardDigits
} from '../../utils/luhn.util';
import { formatMoney as formatMoneyUtil } from '../../utils/money.util';

export interface PaymentDialogData {
  title: string;
  subtitle?: string;
  amount?: number;
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
    MatIconModule
  ],
  templateUrl: './payment-dialog.html',
  styleUrl: './payment-dialog.css'
})
export class PaymentDialogComponent {

  cardNumber = '';
  expiryDate = '';
  cvv = '';

  cardTouched = false;
  expiryTouched = false;
  cvvTouched = false;

  constructor(
    private dialogRef: MatDialogRef<PaymentDialogComponent, PaymentRequest>,
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

  formatMoney(value?: number): string {
    if (value == null) {
      return '';
    }

    return formatMoneyUtil(value);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  pay(): void {
    this.cardTouched = true;
    this.expiryTouched = true;
    this.cvvTouched = true;

    if (!this.isFormValid) {
      return;
    }

    this.dialogRef.close({
      cardNumber: this.cardDigits,
      expiryDate: this.expiryDate,
      cvv: this.cvv
    });
  }
}
