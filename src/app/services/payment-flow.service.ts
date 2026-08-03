import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  getDemoPaymentRequest,
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentDialogResult
} from '../components/payment-dialog/payment-dialog';
import { PaymentFlowResult } from '../models/payment-flow-result';
import { AuthService } from './auth.service';

export interface PaymentFlowOptions {
  title: string;
  subtitle?: string;
  amount?: number;
  showInstallmentOptions?: boolean;
  devicePrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentFlowService {

  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  requestPayment(options: PaymentFlowOptions): Observable<PaymentFlowResult | null | undefined> {
    if (this.authService.isAdmin() && !options.showInstallmentOptions) {
      return of({ payment: this.buildAdminPayment(options.amount) });
    }

    return this.dialog.open<
      PaymentDialogComponent,
      PaymentDialogData,
      PaymentDialogResult
    >(PaymentDialogComponent, {
      width: options.showInstallmentOptions ? '860px' : '520px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        title: options.title,
        subtitle: options.subtitle,
        amount: options.amount,
        showInstallmentOptions: options.showInstallmentOptions,
        devicePrice: options.devicePrice
      }
    }).afterClosed().pipe(
      map((result) => {
        if (!result) {
          return null;
        }
        return {
          payment: result,
          installments: result.installments
        };
      })
    );
  }

  buildAdminPayment(amount?: number) {
    return {
      ...getDemoPaymentRequest(),
      ...(amount != null ? { amount } : {})
    };
  }
}
