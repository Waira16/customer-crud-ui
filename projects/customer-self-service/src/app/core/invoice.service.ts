import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Invoice {
  id: number;
  customerId: number;
  customerName?: string;
  amount: number;
  status: string;
  billingPeriod?: string;
  dueDate?: string;
  tariffs?: string[];
  installmentTotal?: number;
  deviceInstallments?: string[];
}

export interface PaymentRequest {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/invoices`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCustomerInvoices(customerId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(
      `${this.apiUrl}/customer/${customerId}`,
      { headers: this.authHeaders() }
    );
  }

  payInvoice(invoiceId: number, payment: PaymentRequest): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/${invoiceId}/pay`,
      payment,
      { headers: this.authHeaders() }
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
