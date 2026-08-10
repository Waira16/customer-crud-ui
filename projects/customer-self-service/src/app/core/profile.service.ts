import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { InvoiceService } from './invoice.service';

export interface CustomerPortalProfile {
  customerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  packageName: string;
  packageSummary: string;
  packageType?: string;
  totalDataMb?: number;
  totalVoiceMinutes?: number;
  totalSmsCount?: number;
  dataQuotaMb?: number;
  voiceQuotaMinutes?: number;
  smsQuota?: number;
  loyaltyDiscountPercent?: number;
  loyaltyTierLabel?: string;
  loyaltySpendTotal?: number;
  loyaltyProductCount?: number;
  loyaltyNextTierHint?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly base = `${environment.apiBaseUrl}/api/customers/portal`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private invoiceService: InvoiceService
  ) {}

  loadProfile(): Observable<CustomerPortalProfile | null> {
    const customerId = this.authService.getCustomerId();
    if (!customerId) {
      return of(null);
    }

    return this.getProfile().pipe(
      catchError(() => this.loadFromInvoices(customerId))
    );
  }

  getProfile(): Observable<CustomerPortalProfile> {
    return this.http.get<CustomerPortalProfile>(`${this.base}/me`, {
      headers: this.authHeaders()
    });
  }

  private loadFromInvoices(customerId: number): Observable<CustomerPortalProfile> {
    return this.invoiceService.getCustomerInvoices(customerId).pipe(
      map((invoices) => {
        const latest = invoices[0];
        const fullName = latest?.customerName?.trim() || this.authService.getFullName();
        const { firstName, lastName } = splitName(fullName);
        const tariffName = latest?.tariffs?.[0] ?? '';

        return {
          customerId,
          firstName,
          lastName,
          fullName,
          phone: this.authService.getPhone() ?? '',
          packageName: formatPackageName(tariffName),
          packageSummary: tariffName
            ? `${tariffName} · aktif hat paketiniz`
            : 'Tarife bilgisi bulunamadı'
        };
      }),
      catchError(() => of(this.buildMinimalProfile(customerId)))
    );
  }

  private buildMinimalProfile(customerId: number): CustomerPortalProfile {
    return {
      customerId,
      firstName: '',
      lastName: '',
      fullName: this.authService.getFullName(),
      phone: this.authService.getPhone() ?? '',
      packageName: this.authService.getPackageName(),
      packageSummary: this.authService.getPackageSummary()
    };
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function formatPackageName(tariffName: string): string {
  const normalized = tariffName.trim();
  if (!normalized) {
    return 'Aktif paket tanımlı değil';
  }

  const mobileMatch = normalized.match(/Mobil\s+(\d+)\s*GB/i);
  if (mobileMatch) {
    return `${mobileMatch[1]} GB Mobil Paketi`;
  }

  const fiberMatch = normalized.match(/Fiber\s+(\d+)/i);
  if (fiberMatch) {
    return `${fiberMatch[1]} Mbps Fiber Paketi`;
  }

  return normalized.endsWith('Paketi') ? normalized : `${normalized} Paketi`;
}
