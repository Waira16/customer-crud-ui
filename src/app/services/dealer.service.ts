import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  DealerCommissionSummary,
  DealerSaleRequest,
  DealerSaleResponse
} from '../models/dealer';

@Injectable({
  providedIn: 'root'
})
export class DealerService {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/v1/dealers`;

  constructor(private http: HttpClient) {}

  registerSale(request: DealerSaleRequest): Observable<DealerSaleResponse> {
    return this.http.post<DealerSaleResponse>(`${this.apiUrl}/sales`, request);
  }

  getMonthlyCommissions(dealerId: number): Observable<DealerCommissionSummary> {
    return this.http.get<DealerCommissionSummary>(`${this.apiUrl}/${dealerId}/commissions`);
  }
}
