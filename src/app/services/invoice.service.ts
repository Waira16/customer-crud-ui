import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Invoice } from '../models/invoice';
import { InvoiceGenerateResult } from '../models/invoice-generate-result';
import { PaymentRequest } from '../models/payment-request';
import { environment } from '../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class InvoiceService {


  private apiUrl = `${environment.apiBaseUrl}/api/invoices`;




  constructor(
    private http: HttpClient
  ) {}




  getInvoices(): Observable<Invoice[]> {

    return this.http.get<Invoice[]>(
      this.apiUrl
    );

  }


  getInvoicesByCustomer(customerId: number): Observable<Invoice[]> {

    return this.http.get<Invoice[]>(
      `${this.apiUrl}/customer/${customerId}`
    );

  }


  payInvoice(id: number, payment?: PaymentRequest): Observable<unknown> {

    return this.http.post(
      `${this.apiUrl}/${id}/pay`,
      payment ?? {}
    );

  }


  deleteInvoice(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );

  }


  generateInvoices(): Observable<InvoiceGenerateResult> {

    return this.http.post(
      `${this.apiUrl}/generate`,
      {},
      { responseType: 'text' }
    ).pipe(
      map((response) => this.parseGenerateResponse(response))
    );

  }


  private parseGenerateResponse(response: string): InvoiceGenerateResult {

    const trimmed = (response || '').trim();

    if (trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as InvoiceGenerateResult;
      } catch {
        // fall through
      }
    }

    const billingPeriod = this.getCurrentBillingPeriod();

    if (trimmed.includes('başarıyla oluşturuldu')) {
      return {
        billingPeriod,
        createdCount: 0,
        skippedAlreadyBilledCount: 0,
        skippedNoTariffCount: 0,
        message:
          `${billingPeriod} dönemi kontrol edildi. `
          + 'Yeni fatura eklenmediyse bu ay için faturalar zaten mevcut olabilir.'
      };
    }

    return {
      billingPeriod,
      createdCount: 0,
      skippedAlreadyBilledCount: 0,
      skippedNoTariffCount: 0,
      message: trimmed || 'Fatura oluşturma tamamlandı.'
    };

  }


  private getCurrentBillingPeriod(): string {

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    return `${now.getFullYear()}-${month}`;

  }



}
