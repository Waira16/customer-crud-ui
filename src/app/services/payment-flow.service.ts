import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';

import {
  getDemoPaymentRequest,
  PaymentDialogComponent,
  PaymentDialogData
} from '../components/payment-dialog/payment-dialog';
import { PaymentRequest } from '../models/payment-request';
import { AuthService } from './auth.service';

export interface PaymentFlowOptions {
  title: string;
  subtitle?: string;
  amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentFlowService {

  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  requestPayment(options: PaymentFlowOptions): Observable<PaymentRequest | null | undefined> {
    if (this.authService.isAdmin()) {
      return of(this.buildAdminPayment(options.amount));
    }

    return this.dialog.open<
      PaymentDialogComponent,
      PaymentDialogData,
      PaymentRequest
    >(PaymentDialogComponent, {
      width: '520px',
      disableClose: true,
      data: {
        title: options.title,
        subtitle: options.subtitle,
        amount: options.amount
      }
    }).afterClosed();
  }

  buildAdminPayment(amount?: number): PaymentRequest {
    return {
      ...getDemoPaymentRequest(),
      ...(amount != null ? { amount } : {})
    };
  }
}
