import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  DailyUsageSummary,
  UsageSimulateRequest,
  UsageSimulateResponse
} from '../models/usage';

@Injectable({
  providedIn: 'root'
})
export class UsageService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/usage`;

  constructor(private http: HttpClient) {}

  simulateUsage(request: UsageSimulateRequest): Observable<UsageSimulateResponse> {
    return this.http.post<UsageSimulateResponse>(`${this.apiUrl}/simulate`, request);
  }

  getDailySummary(customerId: number): Observable<DailyUsageSummary> {
    return this.http.get<DailyUsageSummary>(
      `${this.apiUrl}/customer/${customerId}/daily-summary`
    );
  }
}
