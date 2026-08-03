import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface DailyUsageSummary {
  customerId: number;
  date: string;
  totalDataMb: number;
  totalVoiceMinutes: number;
  totalSmsCount: number;
  dataQuotaMb?: number;
  voiceQuotaMinutes?: number;
  smsQuota?: number;
}

export interface BuyExtraDataResponse {
  message: string;
  extraGb: number;
  totalBonusMb: number;
}

@Injectable({ providedIn: 'root' })
export class UsageService {
  private readonly portalUsageUrl = `${environment.apiBaseUrl}/api/customers/portal/usage`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getDailySummary(_customerId?: number): Observable<DailyUsageSummary> {
    return this.http.get<DailyUsageSummary>(
      `${this.portalUsageUrl}/daily-summary`,
      { headers: this.authHeaders() }
    );
  }

  buyExtraData(_customerId?: number, extraGb = 5): Observable<BuyExtraDataResponse> {
    return this.http.post<BuyExtraDataResponse>(
      `${this.portalUsageUrl}/buy-extra-data`,
      { extraGb },
      { headers: this.authHeaders() }
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
