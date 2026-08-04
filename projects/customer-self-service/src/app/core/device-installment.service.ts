import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface DeviceInstallment {
  contractId: number;
  customerId: number;
  deviceId?: number;
  deviceName: string;
  monthlyInstallment: number;
  totalInstallments: number;
  remainingInstallments: number;
  startDate?: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class DeviceInstallmentService {
  private readonly base = `${environment.apiBaseUrl}/api/customers/portal`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  listMine(): Observable<DeviceInstallment[]> {
    return this.http.get<DeviceInstallment[]>(
      `${this.base}/device-installments`,
      { headers: this.authHeaders() }
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
